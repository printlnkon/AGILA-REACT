import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "@/api/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, XCircle } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
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

export default function AdminNotifications({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // fetch notifications
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // to get notifications for admin
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("recipientRole", "==", "admin"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    // real-time listener
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ref: doc.ref,
          ...doc.data(),
        }));
        setNotifications(notificationsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleMarkAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(
        (notif) => !notif.isRead
      );
      const updatePromises = unreadNotifications.map((notif) =>
        updateDoc(notif.ref, {
          isRead: true,
        })
      );

      await Promise.all(updatePromises);
      toast.success("All notifications marked as read.");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notificationRef) => {
    try {
      await updateDoc(notificationRef, { isRead: true });
      setIsPopoverOpen(false);
    } catch (error) {
      console.error("Error marking single notification as read:", error);
    }
  };

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
                {notifications.some((n) => !n.isRead) && (
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
                <p>Loading...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b last:border-b-0 hover:bg-muted/50 ${
                    notif.isRead ? "opacity-50" : ""
                  }`}
                >
                  <Link
                    to={notif.link}
                    onClick={() => {
                      handleNotificationClick(notif.ref);
                    }}
                    className="flex items-start gap-3"
                  >
                    {notif.type === "subject_approved" ? (
                      <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="text-sm">
                      <p className="font-semibold">
                        {notif.type === "subject_approved"
                          ? "Subject Approved"
                          : "Subject Rejected"}
                      </p>
                      <p>{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.timestamp?.toDate().toLocaleString()}
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
          {notifications.some((n) => !n.isRead) && (
            <div className="p-1 px-1 border-t flex items-start">
              <Button
                variant="link"
                className="h-auto cursor-pointer no-underline"
                onClick={() => {
                  handleMarkAsRead();
                  setIsPopoverOpen(false);
                }}
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