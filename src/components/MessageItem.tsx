import moment from "moment";
import React from "react";

interface Props {
    sender:string,
    timestamp: number | string,
    body: string,
    key: string | number,
}

const MessageItem:React.FC<Props> = ({sender, timestamp, body, key}) => {
  return (
    <div className="bg-black text-white mb-2 p-3 rounded-xl" key={key}>
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-lg text-gray-300">{sender}</h1>
        <span className="opacity-50">{moment(timestamp).format("HH:mm:ss")}</span>
      </div>
      <p className="font-semibold">{body}</p>
    </div>
  );
};

export default MessageItem;
