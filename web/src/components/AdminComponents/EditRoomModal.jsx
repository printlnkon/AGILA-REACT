import { db } from "@/api/firebase";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collectionGroup,
  writeBatch,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAvailableRooms } from "@/hooks/use-available-rooms";

export default function EditRoomModal({
  open,
  onOpenChange,
  roomData,
  onRoomUpdated,
  existingRooms = [],
}) {
  const [formData, setFormData] = useState({ floor: "", roomNo: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // get available room numbers using custom hook
  const availableRoomNumbers = useAvailableRooms(formData.floor, existingRooms, roomData.roomNo);

  useEffect(() => {
    if (roomData) {
      setFormData({
        floor: roomData.floor || "",
        roomNo: roomData.roomNo || "",
      });
    }
  }, [roomData]);

  const handleSelectChange = (field, value) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };
      if (field === "floor" && prev.floor !== value) {
        const firstAvailable = availableRoomNumbers.find(r => !r.exists);
        newFormData.roomNo = firstAvailable ? firstAvailable.name : "";
      }
      return newFormData;
    });
    setError("");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roomNo || !formData.floor) {
      setError("Both Floor and Room No. are required.");
      return;
    }

    // validation check before submitting
    const isChangingToAnExistingRoom = existingRooms.includes(formData.roomNo) && formData.roomNo !== roomData.roomNo;
    if (isChangingToAnExistingRoom) {
      toast.error("Another room with this number already exists.");
      return;
    }

    setIsSaving(true);
    setError("");

    // determine if the room name actually changed
    const roomNameChanged = formData.roomNo !== roomData.roomNo;

    try {
      const roomRef = doc(db, "rooms", roomData.id);
      const updatedData = {
        roomNo: formData.roomNo,
        floor: formData.floor,
        updatedAt: serverTimestamp(),
      };

      // update the room document
      await updateDoc(roomRef, updatedData);
      toast.success("Room details updated successfully.");

      // if the room name changed, find and update all schedules using this room
      if (roomNameChanged) {
        const batch = writeBatch(db);
        const schedulesQuery = query(
          collectionGroup(db, "schedules"),
          where("roomId", "==", roomData.id)
        );

        const querySnapshot = await getDocs(schedulesQuery);

        if (!querySnapshot.empty) {
          querySnapshot.forEach((scheduleDoc) => {
            batch.update(scheduleDoc.ref, { roomName: formData.roomNo });
          });

          await batch.commit();
          toast.info(
            `Updated ${querySnapshot.size} related schedule(s) with the new room name.`
          );
        }
      }

      // parent component so it can refetch the schedule data
      if (onRoomUpdated) {
        onRoomUpdated({
          ...roomData,
          ...updatedData,
          schedulesUpdated: roomNameChanged,
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating room and related schedules:", err);
      toast.error(
        "Failed to update room and schedules. Please check the console and try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setError("");
  };

  if (!roomData) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>
            Make changes to the room details. Click save changes when you're
            done.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Room Information layout consistent with AddRoomModal */}
          <div className="space-y-4">
            {/* Floor Selection */}
            <div className="space-y-1">
              <Label htmlFor="floor">
                Floor <span className="text-destructive">*</span>
              </Label>
              <Select
                id="floor"
                value={formData.floor}
                onValueChange={(value) => handleSelectChange("floor", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a floor" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }, (_, i) => i + 1).map((floor) => (
                    <SelectItem key={floor} value={floor.toString()}>
                      {floor === 1
                        ? `${floor}st Floor`
                        : floor === 2
                        ? `${floor}nd Floor`
                        : floor === 3
                        ? `${floor}rd Floor`
                        : `${floor}th Floor`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room No. Selection (conditional) */}
            {formData.floor && (
              <div className="space-y-1">
                <Label htmlFor="roomNo">
                  Room No. <span className="text-destructive">*</span>
                </Label>
                <Select
                  id="roomNo"
                  value={formData.roomNo}
                  onValueChange={(value) => handleSelectChange("roomNo", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select room no." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {availableRoomNumbers.map((roomNo) => (
                      <SelectItem 
                        key={roomNo.name} 
                        value={roomNo.name}
                        disabled={roomNo.exists}  
                      >
                        {roomNo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {error && (
            <p className="text-center text-sm text-destructive -mt-2">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleClose}
              type="button"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !formData.floor || !formData.roomNo}
              className="cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin cursor-pointer" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
