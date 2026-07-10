import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Bot, Loader2, Send, Sparkles, UserRound } from 'lucide-react';
import axiosClient from "../utils/axiosClient";

function ChatAi({ problem }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      parts: [{ text: 'Ask me for a hint, a debugging idea, or a simpler explanation of this problem.' }]
    }
  ]);
  const [isSending, setIsSending] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const onSubmit = async (data) => {
    const text = data.message.trim();
    const userMessage = { role: 'user', parts: [{ text }] };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setIsSending(true);
    reset();

    try {
      const response = await axiosClient.post("/ai/chat", {
        messages: nextMessages,
        title: problem.title,
        description: problem.description,
        testCases: problem.visibleTestCases,
        startCode: problem.startCode
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          parts: [{ text: response.data.message }]
        }
      ]);
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          parts: [{ text: 'I could not reach the AI helper right now. Please try again in a moment.' }]
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="cv-panel flex h-full min-h-[30rem] flex-col overflow-hidden">
      <div className="border-b border-base-300 bg-base-200/60 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold">AI Problem Coach</h3>
            <p className="text-sm text-base-content/60">Hints, explanations, and debugging help for this problem.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";

          return (
            <div key={index} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </span>
              )}
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${isUser ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content'}`}>
                {msg.parts[0].text}
              </div>
              {isUser && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-base-300 text-base-content">
                  <UserRound className="h-4 w-4" />
                </span>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-3 text-sm text-base-content/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-base-200 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="border-t border-base-300 bg-base-100 p-4">
        <div className="flex gap-2">
          <input
            placeholder="Ask for a hint without giving away the full answer"
            className={`input input-bordered flex-1 rounded-2xl ${errors.message ? 'input-error' : ''}`}
            {...register("message", {
              required: true,
              validate: (value) => value.trim().length >= 2
            })}
          />
          <button type="submit" className="btn btn-primary btn-square rounded-2xl" disabled={isSending}>
            {isSending ? <span className="loading loading-spinner loading-sm"></span> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatAi;
