import { ArrowLeft, PhoneIcon } from "lucide-react";
import { API_URL } from "../../config/constants";
import avatar from "../../assets/avatar.jpg";

export default function ConversationHeader({
  otherUser,
  isOtherUserOnline,
  navigateBack,
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-base-300 border-b border-base-300">
      <div className="flex items-center gap-3">
        <button onClick={navigateBack}>
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="avatar">
          <div className="w-10 rounded-full">
            <img
              src={
                otherUser?.profileImageUrl
                  ? `${API_URL}${otherUser.profileImageUrl}`
                  : avatar
              }
              alt="User"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-lg">
            {otherUser?.fullName || "User"}
          </span>
          <span className="text-xs text-gray-500">
            {isOtherUserOnline ? (
              <span className="text-caribbean">Online</span>
            ) : (
              <span className="text-gray-400">Offline</span>
            )}
          </span>
        </div>
      </div>

      {otherUser?.phone && (
        <a
          href={`tel:${otherUser.phone}`}
          className="p-2 rounded-full hover:bg-base-200 text-green-600"
        >
          <PhoneIcon className="w-5 h-5" />
        </a>
      )}
    </div>
  );
}
