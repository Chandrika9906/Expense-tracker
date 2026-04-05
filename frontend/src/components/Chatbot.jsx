import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react";
import { chatService, expenseService } from "../services/authService";
import toast from "react-hot-toast";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I am your AI financial advisor. How can I help you today?",
      type: "text",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { role: "user", text: inputText, type: "text" };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(userMessage.text);
      const { text, action, data } = response.data;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text, type: "text" },
      ]);

      if (action === "ADD_EXPENSE" && data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "action",
            actionType: "ADD_EXPENSE",
            data: data,
            text: `I noticed you want to add an expense: ${data.title} - ₹${data.amount}`,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn't reach the server.",
          type: "error",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAddExpense = async (expenseData) => {
    try {
      const payload = {
        title: expenseData.title,
        amount: Number(expenseData.amount),
        category: expenseData.category || "Other",
        date: expenseData.date || new Date().toISOString().split("T")[0],
        notes: "Added via AI assistant",
        isRecurring: false,
        recurringInterval: "monthly",
      };

      await expenseService.createExpense(payload);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Expense added successfully! ✅",
          type: "success",
        },
      ]);
      toast.success("Expense added via AI");
    } catch (error) {
      toast.error("Failed to add expense");
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 ${isOpen ? "hidden" : "block"}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 flex flex-col font-sans">
          {/* Header */}
          <div className="p-4 bg-indigo-600 text-white rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bot className="w-6 h-6" />
              <span className="font-semibold">Financial AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-indigo-700 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Action UI */}
                  {msg.type === "action" &&
                    msg.actionType === "ADD_EXPENSE" && (
                      <div className="mt-3 bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                        <p className="font-semibold">{msg.data.title}</p>
                        <p className="text-xl font-bold">₹{msg.data.amount}</p>
                        <button
                          onClick={() => confirmAddExpense(msg.data)}
                          className="mt-2 w-full bg-indigo-600 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700"
                        >
                          Confirm Add
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl"
          >
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask or add expense..."
                className="flex-1 bg-transparent focus:outline-none text-sm dark:text-white dark:placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="text-indigo-600 dark:text-indigo-400 p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
