import { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useActiveSession } from "@/context/ActiveSessionContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Edit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // editing
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const { activeSession, loading: sessionLoading } = useActiveSession();

  // auth listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      try {
        const db = getFirestore();
        const role = "student";
        const userDocRef = doc(db, "users", role, "accounts", currentUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = { id: currentUser.uid, ...snap.data() };
          setProfileData(data);
          setFormData(data);
        } else {
          toast.error("Profile not found");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) fetchProfile();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSaveChanges = async () => {
    if (!formData || !currentUser) return;
    try {
      const db = getFirestore();
      const storage = getStorage();
      const role = "student";
      const userDocRef = doc(db, "users", role, "accounts", currentUser.uid);

      let updates = {
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        sectionName: formData.sectionName || "",
        courseName: formData.courseName || "",
        yearLevelName: formData.yearLevelName || "",
      };

      if (selectedImage) {
        const storageRef = ref(
          storage,
          `studentsPhoto/${formData.studentNumber}/${selectedImage.name}`
        );
        await uploadBytes(storageRef, selectedImage);
        const downloadURL = await getDownloadURL(storageRef);
        updates.profileImage = downloadURL;
      }

      await updateDoc(userDocRef, updates);

      setProfileData((prev) => ({ ...prev, ...updates }));
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p>Loading Profile...</p>
      </div>
    );
  }

  if (!currentUser || !profileData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p>Could not load profile. Please log in.</p>
      </div>
    );
  }

  const fullName = `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim();
  const currentPhotoURL = selectedImage
    ? URL.createObjectURL(selectedImage)
    : profileData.profileImage;

  // --- Edit mode ---
  if (isEditing && formData) {
    return (
      <div className="w-full p-4 lg:p-6">
        <div className="flex justify-between mb-4">
          <Button
            variant="outline"
            className="cursor-pointer text-sm gap-2"
            onClick={() => setIsEditing(false)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* edit photo */}
          <Card className="w-full max-w-sm mx-auto lg:mx-0">
            <CardHeader>
              <div className="font-semibold text-lg">Edit Profile Picture</div>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center">
              <div
                className="relative w-36 h-36 mb-4 rounded-full group cursor-pointer"
                onClick={() => fileInputRef.current.click()}
              >
                {currentPhotoURL ? (
                  <img
                    src={currentPhotoURL}
                    alt="Profile"
                    className="w-full h-full rounded-full border-4 border-white shadow-md object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold">
                    {profileData.firstName?.charAt(0)}
                    {profileData.lastName?.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </CardContent>
          </Card>

          <div className="w-full flex flex-col gap-4">
            {/* student info */}
            <Card>
              <CardHeader>
                <div className="font-semibold text-lg">Edit Student Information</div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Email</Label>
                  <Input value={currentUser.email} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Student Number</Label>
                  <Input value={formData.studentNumber || ""} disabled />
                </div>
              </CardContent>
            </Card>

            {/* academic info */}
            <Card>
              <CardHeader>
                <div className="font-semibold text-lg">Edit Academic Information</div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sectionName">Section</Label>
                  <Input value={formData.sectionName || ""} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="courseName">Course</Label>
                  <Input value={formData.courseName || ""} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="yearLevelName">Year Level</Label>
                  <Input value={formData.yearLevelName || ""} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Term</Label>
                  <Input
                    value={
                      sessionLoading
                        ? "Loading..."
                        : activeSession?.semesterName || "Not set"
                    }
                    disabled
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </div>
      </div>
    );
  }

  // --- View mode ---
  return (
    <div className="w-full p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* photo */}
        <Card className="w-full max-w-sm mx-auto lg:mx-0">
          <CardContent className="p-6 flex flex-col items-center">
            {profileData.profileImage ? (
              <img
                src={profileData.profileImage}
                alt="Profile"
                className="w-28 h-28 rounded-full border-4 border-white shadow-md object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold">
                {profileData.firstName?.charAt(0)}
                {profileData.lastName?.charAt(0)}
              </div>
            )}
            <div className="text-lg font-semibold mt-2">{fullName}</div>
            <div className="text-sm text-muted-foreground">{currentUser.email}</div>
          </CardContent>
        </Card>

        <div className="w-full flex flex-col gap-4">
          {/* student info */}
          <Card>
            <CardHeader>
              <div className="font-semibold text-lg">Student Information</div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  First Name
                </p>
                <p>{profileData.firstName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Last Name
                </p>
                <p>{profileData.lastName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Email</p>
                <p>{currentUser.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Student Number
                </p>
                <p>{profileData.studentNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* academic info */}
          <Card>
            <CardHeader>
              <div className="font-semibold text-lg">Academic Information</div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Section</p>
                <p>{profileData.sectionName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Course</p>
                <p>{profileData.courseName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Year Level
                </p>
                <p>{profileData.yearLevelName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Term</p>
                <p>
                  {sessionLoading
                    ? "Loading..."
                    : activeSession?.semesterName || "Not set"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={() => setIsEditing(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>
    </div>
  );
}
