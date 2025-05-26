document.addEventListener('DOMContentLoaded', function() {

    const chatContainer = document.getElementById('chatContainer');
    const openChatBtn = document.getElementById('openChatBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatMessages = document.getElementById('chatMessages');


    const chatbotResponses = {
        'default': "I'm not sure I understand. Could you please rephrase your question about the Dialectica debate platform?",
        'greeting': ["Hello! How can I assist you with Dialectica today?", "Hi there! What can I help you with regarding our debate platform?"],
        'help': "I can help you with questions about debate formats, platform features, account management, tournament setup, and technical support. What would you like to know more about?",
        'contact': "You can reach our support team via email at info.dialectica91@gmail.com or call us at +91 9631593615. Our office is located at Boys Hostel, SMVIT Campus, Bengaluru, India.",
        'features': "Dialectica offers real-time video debates, speech-to-text transcription, judge scoring systems, audience participation tools, and tournament management features. Which feature would you like to learn more about?",
        'pricing': "We offer three pricing tiers: Basic (Free), Pro ($19/month), and Enterprise ($49/month). Each tier offers different features and capabilities. Would you like me to explain the differences?",
        'debate_format': "Dialectica supports various debate formats including Lincoln-Douglas, Policy Debate, Public Forum, and custom formats. You can configure time limits, speaking order, and judging criteria for each format.",
        'technical_issue': "I'm sorry you're experiencing technical difficulties. Common solutions include: refreshing your browser, checking your internet connection, ensuring your camera/microphone permissions are enabled, or trying a different browser. If problems persist, please contact our support team.",
        'account': "You can manage your account settings by logging in and clicking on your profile icon in the top-right corner. From there, you can update your profile, manage subscription, adjust notification settings, and configure security options.",
        'tournament': "To set up a tournament, go to the 'Events' section after logging in, click 'Create Tournament', and follow the step-by-step guide to configure brackets, invite participants, assign judges, and set schedules."
    };


    function openChat() {
        chatContainer.style.display = 'flex';
        chatInput.focus();
    }


    function closeChat() {
        chatContainer.style.display = 'none';
    }


    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        contentDiv.textContent = text;

        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator');
        indicator.id = 'typingIndicator';

        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            indicator.appendChild(dot);
        }

        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    function hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }


    function getChatbotResponse(userMessage) {
        const message = userMessage.toLowerCase();

        if (message.match(/^(hi|hello|hey|greetings)/)) {
            const greetings = chatbotResponses['greeting'];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        if (message.includes('help') || message.includes('assist') || message.includes('support')) {
            return chatbotResponses['help'];
        }

        if (message.includes('contact') || message.includes('email') || message.includes('phone') || message.includes('call') || message.includes('reach')) {
            return chatbotResponses['contact'];
        }

        if (message.includes('feature') || message.includes('offer') || message.includes('provide') || message.includes('capability')) {
            return chatbotResponses['features'];
        }

        if (message.includes('price') || message.includes('cost') || message.includes('subscription') || message.includes('plan') || message.includes('payment')) {
            return chatbotResponses['pricing'];
        }

        if (message.includes('format') || message.includes('style') || message.includes('type of debate') || message.includes('debate type')) {
            return chatbotResponses['debate_format'];
        }

        if (message.includes('not working') || message.includes('error') || message.includes('problem') || message.includes('issue') || message.includes('bug') || message.includes('fix')) {
            return chatbotResponses['technical_issue'];
        }

        if (message.includes('account') || message.includes('profile') || message.includes('settings') || message.includes('password') || message.includes('login')) {
            return chatbotResponses['account'];
        }

        if (message.includes('tournament') || message.includes('competition') || message.includes('event') || message.includes('bracket') || message.includes('contest')) {
            return chatbotResponses['tournament'];
        }

        return chatbotResponses['default'];
    }


    function sendMessage() {
        const userMessage = chatInput.value.trim();

        if (userMessage === '') return;

        addMessage(userMessage, true);

        chatInput.value = '';

        showTypingIndicator();

        setTimeout(() => {
            hideTypingIndicator();

            const botResponse = getChatbotResponse(userMessage);
            addMessage(botResponse);
        }, Math.random() * 1000 + 1000);
    }


    openChatBtn.addEventListener('click', openChat);
    closeChatBtn.addEventListener('click', closeChat);

    sendMessageBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    const floatingChatBtn = document.createElement('button');
    floatingChatBtn.classList.add('floating-chat-btn');
    floatingChatBtn.innerHTML = '<i class="fas fa-comment-dots"></i>';
    floatingChatBtn.addEventListener('click', openChat);
    document.body.appendChild(floatingChatBtn);

    const style = document.createElement('style');
    style.textContent = `
        .floating-chat-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #0d6efd;
            color: white;
            border: none;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: all 0.3s ease;
        }

        .floating-chat-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
        }

        .chat-container[style*="flex"] ~ .floating-chat-btn {
            display: none;
        }
    `;
    document.head.appendChild(style);
});
