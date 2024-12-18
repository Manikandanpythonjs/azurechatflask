import React, { useState, useEffect } from "react";

const Chatstream = () => {
    const [userInput, setUserInput] = useState("");
    const [conversation, setConversation] = useState([
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What are the applications of AI?" },
    ]);
    const [chatHistory, setChatHistory] = useState([]);
    const [streamingResponse, setStreamingResponse] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userInput.trim()) return;

        const userMessage = { role: "user", content: userInput };
        setChatHistory((prev) => [...prev, userMessage]);

        const updatedConversation = [...conversation, userMessage];
        setConversation(updatedConversation);

        setUserInput("");
        setIsStreaming(true);
        setStreamingResponse("");

        try {
            const payload = {
                user_input: userInput,
                conversation: updatedConversation,
            };

            const response = await fetch("http://127.0.0.1:5000/generate_text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.body) {
                throw new Error("No response body received");
            }


            await streamResponse(response.body);
        } catch (error) {
            console.error("Error fetching response:", error);
            setChatHistory((prev) => [
                ...prev,
                { role: "system", content: "Sorry, something went wrong." },
            ]);
            setIsStreaming(false);
        }
    };





    const streamResponse = async (stream) => {
        const reader = stream.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let finalResponse = "";

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            const chunk = decoder.decode(value, { stream: true });
            setStreamingResponse((prev) => {
                finalResponse += chunk;
                return prev + chunk;
            });
        }

        setChatHistory((prev) => [
            ...prev,
            { role: "system", content: finalResponse },
        ]);

        setConversation((prev) => [
            ...prev,
            { role: "system", content: finalResponse },
        ]);

        setIsStreaming(false);
    };





    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">

                <div className="mb-4 space-y-4">
                    {chatHistory.map((chat, index) => (
                        <div
                            key={index}
                            className={`${chat.role === "user"
                                ? "text-right"
                                : "text-left text-gray-800"
                                }`}
                        >
                            <div
                                className={`inline-block px-4 py-2 rounded-lg ${chat.role === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200"
                                    }`}
                            >
                                {chat.content}
                            </div>
                        </div>
                    ))}

                    {isStreaming && (
                        <div className="text-left text-gray-800">
                            <div className="inline-block px-4 py-2 rounded-lg bg-gray-200">
                                {streamingResponse}
                                <span className="w-2 h-5 bg-gray-800 animate-pulse inline-block ml-1" />
                            </div>
                        </div>
                    )}
                </div>


                <form onSubmit={handleSubmit} className="flex items-center">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatstream;
