import { useState, useEffect } from "react";

export function useAvailableRooms(floor, existingRooms, currentRoomNo = null) {
  const [availableRoomNumbers, setAvailableRoomNumbers] = useState([]);

  useEffect(() => {
    if (floor) {
      const floorPrefix = floor;
      const roomNumbers = Array.from({ length: 10 }, (_, i) => {
        const num = i + 1;
        const roomName = `RM ${floorPrefix}${num < 10 ? "0" : ""}${num}`;
        return {
          name: roomName,
          exists: existingRooms.includes(roomName) && roomName !== currentRoomNo,
        };
      });
      setAvailableRoomNumbers(roomNumbers);
    } else {
      setAvailableRoomNumbers([]);
    }
  }, [floor, existingRooms, currentRoomNo]);

  return availableRoomNumbers;
}
