from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import os
import pandas as pd
import traceback
from deepface import DeepFace
import csv
import firebase_admin
from firebase_admin import credentials, firestore, storage
from google.cloud.firestore_v1.base_query import FieldFilter
import io

app = Flask(__name__)
CORS(app)

# Initialize Firebase Admin SDK
cred = credentials.Certificate("web/src/api/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {'storageBucket': 'agila-c10a4.firebasestorage.app'})

db = firestore.client()
bucket = storage.bucket()

def decode_base64_image(base64_string):
    try:
        header, encoded = base64_string.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        return cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    except Exception as e:
        print("Decode error:", e)
        return None
    
def upload_to_firebase_storage(image_data, role, user_name, unique_number, image_index):
    try:
        safe_role = role.replace(" ", "_").lower()
        safe_name = user_name.replace(" ", "_").lower()
        safe_number = str(unique_number).strip()

        file_path = f"faces/{safe_role}/{safe_number}/{safe_name}/face_{image_index}.jpg"

        blob = bucket.blob(file_path)
        blob.upload_from_string(image_data, content_type='image/jpeg')
        blob.make_public()
        return blob.public_url
    except Exception as e:
        print("Firebase upload error:", e)
        return None

@app.route("/detect_face", methods=["POST"])
def detect_face():
    data = request.get_json()

    if not data or "image" not in data or "name" not in data:
        return jsonify({"detected": False, "message": "Invalid request"}), 400

    image_data = data["image"]
    name = data["name"]

    img = decode_base64_image(image_data)
    if img is None:
        return jsonify({"detected": False, "message": "Invalid image data"}), 400

    try:
        face_objs = DeepFace.extract_faces(
            img_path=img, 
            detector_backend='mtcnn', 
            enforce_detection=False, 
            align=False 
        )

        if not face_objs:
            return jsonify({"detected": False, "message": "No face detected"}), 200

        # Find the largest face
        largest_face = None
        max_area = 0
        for face_obj in face_objs:
            face_area = face_obj['facial_area']
            area = face_area['w'] * face_area['h']
            if area > max_area:
                max_area = area
                largest_face = face_area

        if not largest_face:
             return jsonify({"detected": False, "message": "No face detected"}), 200

        x, y, w, h = largest_face['x'], largest_face['y'], largest_face['w'], largest_face['h']

        return jsonify({
            "detected": True,
            "box": {
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h)
            }
        }), 200

    except Exception as e:
        print("DeepFace detection error:", e)
        return jsonify({"detected": False, "message": "Face detection failed"}), 200

@app.route("/register-face", methods=["POST"])
def register_face():
    try:
        data = request.get_json()
        if not data or "images" not in data or "name" not in data or "email" not in data:
            return jsonify({"success": False, "message": "Missing data"}), 400
        
        unique_number = data.get("uniqueNumber", "").strip()
        if not unique_number:
            return jsonify({"success": False, "message": "Unique number is required"}), 400

        name = data["name"]
        email = data["email"]
        images = data["images"]

        role = (data.get("role") or "").strip()
        if not role:
            users_ref = db.collection_group("accounts").where(
                filter=FieldFilter("email", "==", email)
            ).limit(1).get()
            if users_ref:
                role = str(users_ref[0].to_dict().get("role", "")).strip()

        if not role:
            return jsonify({"success": False, "message": "Missing 'role'"}), 400
        
        # Upload images to Firebase Storage
        uploaded_urls = []
        for idx, base64_img in enumerate(images):
            # Decode base64 to bytes
            header, encoded = base64_img.split(",", 1)
            img_bytes = base64.b64decode(encoded)

            url = upload_to_firebase_storage(img_bytes, role, name, unique_number, idx)
            if url:
                uploaded_urls.append(url)
            else:
                print(f"Failed to upload image {idx} for {name}")

        if not uploaded_urls:
            return jsonify({"success": False, "message": "Failed to upload any images"}), 500

        # Extract embeddings and save to a local CSV 
        embeddings = []
        for idx, base64_img in enumerate(images):
            img = decode_base64_image(base64_img)
            if img is None:
                continue
            
            resized_img = cv2.resize(img, (160, 160))
            
            try:
                embedding_result = DeepFace.represent(
                    resized_img,
                    model_name='SFace',
                    enforce_detection=True,
                    detector_backend='skip'
                )
                if embedding_result and 'embedding' in embedding_result[0]:
                    embeddings.append(embedding_result[0]['embedding'])
            except Exception as e:
                print(f"[ERROR] DeepFace failed on image {idx}:", e)
                continue

        if not embeddings:
            return jsonify({"success": False, "message": "No valid face embeddings found"}), 400

        # Create DataFrame and save to features.csv
        embeddings = [np.array(e).flatten() for e in embeddings]
        df_new = pd.DataFrame(embeddings, columns=[f'f{i}' for i in range(128)])
        df_new.insert(0, 'name', name)
        
        features_path = "features.csv"
        if os.path.exists(features_path):
            df_existing = pd.read_csv(features_path)
            df_combined = pd.concat([df_existing, df_new], ignore_index=True)
            df_combined.to_csv(features_path, index=False, quoting=csv.QUOTE_ALL)
        else:
            df_new.to_csv(features_path, index=False, quoting=csv.QUOTE_ALL)

        # Update Firestore document with new data
        users_ref = db.collection_group("accounts").where(filter=FieldFilter("email", "==", email)).limit(1).get()
        
        if users_ref:
            doc_ref = users_ref[0].reference
            doc_ref.update({
                "faceRegistered": True,
                "faceImageURLs": uploaded_urls
            })
            print(f"[DONE] Saved face data for {name} to Firestore.")
        else:
            print(f"[WARN] No user found with email {email}. Face data not saved to Firestore.")
            
        print(f"[DONE] Saved {len(embeddings)} embeddings for {name} to CSV.")
        return jsonify({"success": True}), 200

    except Exception as e:
        print("Error in /register-face:", e)
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/try-recognition", methods=["POST"])
def try_recognition():
    try:
        data = request.get_json()
        if not data or "image" not in data:
            return jsonify({"success": False, "message": "No image provided"}), 400

        img = decode_base64_image(data["image"])
        if img is None:
            return jsonify({"success": False, "message": "Invalid image"}), 400

        img_resized = cv2.resize(img, (640, 480))

        face_objs = DeepFace.extract_faces(
            img_path=img_resized,
            detector_backend='mtcnn',
            enforce_detection=False,
            align=False
        )

        detected_faces_count = len(face_objs)

        if not face_objs:
            return jsonify({
                "success": False,
                "message": "No face detected",
                "detected_faces": 0,
                "results": []
            }), 200

        features_path = "features.csv"
        if not os.path.exists(features_path):
            return jsonify({
                "success": False,
                "message": "features.csv not found",
                "detected_faces": detected_faces_count,
                "results": []
            }), 400
        
        df = pd.read_csv(features_path)
        names = df["name"]
        embeddings_db = df.drop(columns=["name"]).values
        
        from numpy import dot
        from numpy.linalg import norm
        def cosine_similarity(a, b):
            return dot(a, b) / (norm(a) * norm(b))

        results = []
        for face_obj in face_objs:
            face_area = face_obj['facial_area']
            x, y, w, h = face_area['x'], face_area['y'], face_area['w'], face_area['h']

            if x == 0 and y == 0 and w == img_resized.shape[1] and h == img_resized.shape[0]:
                continue
                
            face_crop = img_resized[y:y + h, x:x + w]
            face_crop = cv2.resize(face_crop, (160, 160))

            embedding_result = DeepFace.represent(
                face_crop,
                model_name='SFace',
                enforce_detection=False,
                detector_backend='skip'
            )

            if not embedding_result or 'embedding' not in embedding_result[0]:
                results.append({
                    "success": False,
                    "name": "Embedding failed",
                    "similarity": 0,
                    "box": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}
                })
                continue
            
            test_embedding = np.array(embedding_result[0]['embedding'])
            best_similarity = 0
            best_name = "Unknown"
            threshold = 0.9

            for i, emb in enumerate(embeddings_db):
                similarity = cosine_similarity(emb, test_embedding)
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_name = names.iloc[i]

            matched = bool(best_similarity >= threshold)

            results.append({
                "success": matched,
                "name": str(best_name if matched else "Unknown"),
                "similarity": float(best_similarity.item() if hasattr(best_similarity, "item") else best_similarity),
                "box": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}
            })

        return jsonify({
            "success": True,
            "detected_faces": len(results),
            "results": results
        }), 200

    except Exception as e:
        print("Error in /try-recognition:", e)
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e), "detected_faces": 0, "results": []}), 500

if __name__ == "__main__":
    app.run(port=5000)