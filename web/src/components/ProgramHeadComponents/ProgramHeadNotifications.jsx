import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "@/api/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Bell, FilePenLine, FilePlus, Trash2 } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProgramHeadNotifications({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // fetch notifications for the current program head
  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // to get notifications for the current program head
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    // real-time listener
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notificationsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching program head notifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((notif) => !notif.read);
      const updatePromises = unreadNotifications.map((notif) => {
        const notifRef = doc(db, "notifications", notif.id);
        return updateDoc(notifRef, { read: true });
      });
      await Promise.all(updatePromises);
      toast.success("All notifications marked as read.");
      setIsPopoverOpen(false);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      const notifRef = doc(db, "notifications", notificationId);
      await updateDoc(notifRef, { read: true });
      setIsPopoverOpen(false);
    } catch (error) {
      console.error("Error marking single notification as read:", error);
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <TooltipProvider>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative h-9 w-9 cursor-pointer text-muted-foreground"
              >
                <Bell className="h-4 w-4" />
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent align="end" className="w-96 p-0">
          <div className="flex items-center gap-3 p-3 border-b">
            <Bell className="h-4 w-4" />
            <h4 className="font-medium">Notifications</h4>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground p-8">
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b last:border-b-0 hover:bg-muted/50 ${
                    notif.read ? "opacity-60" : ""
                  }`}
                >
                  <Link
                    to="/program-head/subject-approval"
                    onClick={() => handleNotificationClick(notif.id)}
                    className="flex items-start gap-3"
                  >
                    {notif.title?.includes("Modified") ? (
                      <FilePenLine className="h-5 w-5 mt-0.5 text-blue-500 flex-shrink-0" />
                    ) : notif.title?.includes("New Subject Added") ? (
                      <FilePlus className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Trash2 className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="text-sm">
                      <p className="font-semibold">{notif.title}</p>
                      <p>{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.createdAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground p-8">
                <p>You have no new notifications.</p>
              </div>
            )}
          </div>
          {hasUnread && (
            <div className="p-1 px-1 border-t flex items-start">
              <Button
                variant="link"
                className="h-auto cursor-pointer no-underline"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}