export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  id?: string;
  isNew?: boolean;
};

export type BackendResponse = {
  code: "refine" | "finish";
  message: string;
};

export type ChatMode = "initial" | "refining" | "finished";

