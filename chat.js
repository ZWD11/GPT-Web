const ChatWindow = {
  template: `
    <div class="chat-window">
      <div class="chat-header"> 
        <button class="back-button" @click="toggleSidebar"> <i class="fas fa-chevron-left"></i> 
        </button>
        <div class="conversation-name">{{ currentConversationName }}</div>
      </div>
      <div class="chat-messages" ref="chatMessages" @scroll="handleScroll">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.isUser ? 'user' : 'bot']">
          <div class="avatar">
            <img :src="message.isUser ? 'user.png' : 'bot.png'" alt="Avatar">
          </div>
          <div class="content" v-html="message.displayContent"></div>
        </div>
      </div>
      <button id="scroll-to-bottom" @click="scrollToBottom" style="display: none;"><i class="fas fa-chevron-down"></i></button>
      <div class="input-area">
        <label for="imageUpload" class="upload-button">
          <i class="fas fa-image"></i> 
        </label>
        <input type="file" id="imageUpload" style="display: none;"> 
        <div class="chat-input">
          <textarea v-model="newMessage" @keydown="handleKeyDown" placeholder="Enter 发送，Shift + Enter 换行" ref="textarea"></textarea>
          <button @click="sendMessage">发送</button>
        </div>
      </div>
    </div>
  `,
  props: ['messages','toggleSidebar','conversationName'],
  data() {
    return {
      newMessage: '',
    };
  },
  computed: {
    currentConversationName() {
      if (this.$root.currentConversation !== null) {
        return this.$root.conversations[this.$root.currentConversation].name;
      } else {
        return '';
      }
    }
  },
  methods: {
    sendMessage() {
      if (this.newMessage.trim() === '') return;
      const formattedMessage = this.newMessage;
      this.$emit('send-message', formattedMessage);
      this.newMessage = '';
      this.$nextTick(() => {
        if (typeof MathJax !== 'undefined') {
          MathJax.typesetPromise().then(() => {
            console.log('MathJax 渲染完成');
            this.highlightCode();
            this.scrollToBottom();
          });
        }
      });
    },
    handleKeyDown(event) {
      if (event.keyCode == 13) {
        event.preventDefault();
        if (event.shiftKey) {
          event.preventDefault();
          const textarea = event.target;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          const newText = text.substring(0, start) + '\n' + text.substring(end);
          textarea.value = newText;
          textarea.setSelectionRange(start + 1, start + 1);
          console.log(textarea.value);
          this.newMessage = textarea.value;
        } else {
          event.preventDefault();
          this.sendMessage();
        }
      }
    },
    scrollToBottom() {
      const chatMessages = this.$refs.chatMessages;
      chatMessages.scrollTop = chatMessages.scrollHeight;
      this.hideScrollButton();
    },
    handleScroll() {
      const chatMessages = this.$refs.chatMessages;
      const scrollTop = chatMessages.scrollTop;
      const scrollHeight = chatMessages.scrollHeight;
      const clientHeight = chatMessages.clientHeight;

      if (scrollTop + clientHeight < scrollHeight - 50) {
        this.showScrollButton();
      } else {
        this.hideScrollButton();
      }
    },
    showScrollButton() {
      const scrollButton = document.getElementById('scroll-to-bottom');
      scrollButton.style.display = 'flex';
    },
    hideScrollButton() {
      const scrollButton = document.getElementById('scroll-to-bottom');
      scrollButton.style.display = 'none';
    },
    highlightCode() {
      this.$nextTick(() => {
        if (this.$el && this.$el.querySelectorAll) {
          const blocks = this.$el.querySelectorAll('pre code');
          blocks.forEach((block) => {
            hljs.highlightElement(block);
            if (!block.parentElement.querySelector('.copy-button')) {
              const button = document.createElement('button');
              button.innerText = 'copy';
              button.className = 'copy-button';
              button.addEventListener('click', () => {
                this.copyToClipboard(block.innerText);
              });
              block.parentElement.style.position = 'relative';
              block.parentElement.appendChild(button);
            }
          });
        }
      });
    },
    copyToClipboard(code) {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showCopySuccessMessage();
    },
    showCopySuccessMessage() {
      const message = document.createElement('div');
      message.className = "copy-success-message";
      message.innerText = "已复制到剪切板";
      document.body.appendChild(message);

      setTimeout(() => {
        document.body.removeChild(message)
      },2000);
    },
    toggleSidebar() {
      this.isSidebarVisible = !this.isSidebarVisible;
    },
    selectConversation(index) {
      this.selectedConversationIndex = index;
      this.currentConversation = index;
  
      if (window.innerWidth <= 768) { 
        this.isSidebarVisible = false;
      }
  
      this.newMessage = '';
      this.$nextTick(() => {
        MathJax.typesetPromise();
        this.highlightCode();
      });
    }
  },
  updated() {
    if (typeof MathJax !== 'undefined') {
      MathJax.typesetPromise().then(() => {
        console.log('MathJax 渲染完成');
        this.highlightCode();
      });
    } else {
      console.error('MathJax is not loaded');
    }
  },
  mounted() {
    autosize(this.$refs.textarea);
  },
};
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
const app = Vue.createApp({
  components: {
    ChatWindow,
  },
  data() {
    return {
      conversations: [
        {
          name: '新的对话',
          messages: [
            {
              content: '你好，我是 AI 机器人，请问有什么问题可以帮助您？',
              isUser: false,
              displayContent:
                '<p>你好，我是 AI 机器人，请问有什么问题可以帮助您？</p>',
            },
          ],
        },
      ],
      currentConversation: 0,
      selectedModel: 'gpt-4o',
      selectedConversationIndex: null, 
      isSidebarVisible: false, 
    };
  },
  mounted() {
    this.loadConversations();
    if (this.conversations.length === 0) {
      this.addNewConversation();
    }
    this.$nextTick(() => {
      if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise().then(() => {
          console.log('MathJax 渲染完成');
          this.highlightCode();
        });
      } else {
        console.error('MathJax is not loaded');
      }
    });
  },
  methods: {
    sendMessage(message) {
      const currentMessages = this.conversations[this.currentConversation].messages;
      const escapedMessage = escapeHtml(message);
      const Messages = marked.parse(escapedMessage);
      
      currentMessages.push({
        content: escapedMessage,
        isUser: true,
        displayContent: Messages.replace(/\n$/g,''),
      });

      if (currentMessages.length === 2) {
        this.conversations[this.currentConversation].name = currentMessages[1].content.substring(0, 16);
      }
      this.saveConversations();

      this.sendMessageToAPI(message, this.currentConversation)
        .then((botMessage) => {
          const botmessage = escapeHtml(botMessage);
          const markedbotmessage = marked.parse(botmessage);
          currentMessages.push({
            content: botMessage,
            isUser: false,
            displayContent: markedbotmessage,
          });

          this.saveConversations();

          this.typeMessage(currentMessages[currentMessages.length - 1]);
          this.$nextTick(() => {
            MathJax.typesetPromise().then(() => {
              console.log('MathJax 渲染完成');
              this.highlightCode();
          }).catch((err) => {
              console.error('MathJax 渲染错误:', err);
          });
          });
        })
        .catch((error) => {
          console.error('Error sending message:', error);
          currentMessages.push({
            content: '发送消息失败，请稍后重试。',
            isUser: false,
            displayContent: '<p>发送消息失败，请稍后重试。</p>',
          });

          this.saveConversations();
        });

      this.$nextTick(() => {
        MathJax.typesetPromise();
        this.highlightCode();
      });
    },
    async sendMessageToAPI(userMessage, conversationIndex) {
      const apiKey = 'your_apikey'; 
      const conversation = this.conversations[conversationIndex];

      try {
        const messagesForAPI = conversation.messages.map((message) => ({
          role: message.isUser ? 'user' : 'assistant',
          content: message.content,
        }));

        const response = await fetch('/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.selectedModel,
            messages: messagesForAPI,
            max_tokens: '12800'
          }),
        });

        const data = await response.json();
        const botMessage = data.choices[0].message.content; 
        return botMessage;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    typeMessage(message) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i <= message.content.length) {
          message.displayContent = marked.parse(message.content.substring(0, i));
          i++;
        } else {
          message.displayContent = marked.parse(message.content);
          clearInterval(typingInterval);
          this.$nextTick(() => {
            MathJax.typesetPromise().then(() => {
              console.log('MathJax 渲染完成');
              this.highlightCode();
          }).catch((err) => {
              console.error('MathJax 渲染错误:', err);
          });
          });
        }
      }, 10);
    },
    addNewConversation() {
      const newConversation = {
        name: '新的对话',
        messages: [
          {
            content: '你好，我是 AI 机器人，请问有什么问题可以帮助您？',
            isUser: false,
            displayContent: '<p>你好，我是 AI 机器人，请问有什么问题可以帮助您？</p>',
          },
        ],
        selectedModel: this.selectedModel, 
      };
      this.conversations.push(newConversation);
      this.currentConversation = this.conversations.length - 1;
      this.saveConversations();
      this.newMessage = '';
      this.$nextTick(() => {
        MathJax.typesetPromise();
        this.highlightCode();
      });
    },
    deleteConversation(index) {
      if (confirm('确定要删除此对话吗？')) {
        this.conversations.splice(index, 1);
        if (this.currentConversation === index) {
          this.currentConversation = this.conversations.length > 0 ? 0 : null;
        }
        this.saveConversations();
      }
    },
    selectConversation(index) {
      this.selectedConversationIndex = index;
      this.currentConversation = index;
      this.newMessage = '';
      this.$nextTick(() => {
        MathJax.typesetPromise();
        this.highlightCode();
      });
    },
    saveConversations() {
      localStorage.setItem('conversations', JSON.stringify(this.conversations));
    },
    loadConversations() {
      const savedConversations = localStorage.getItem('conversations');
      if (savedConversations) {
        this.conversations = JSON.parse(savedConversations);
      }
    },
    highlightCode() {
      this.$nextTick(() => {
        if (this.$el && this.$el.querySelectorAll){
          const blocks = this.$el.querySelectorAll('pre code');
          blocks.forEach((block) => {
            hljs.highlightElement(block);
            if (!block.parentElement.querySelector('.copy-button')) {
              const button = document.createElement('button');
              button.innerText = 'copy';
              button.className = 'copy-button';
              button.addEventListener('click', () => {
                this.copyToClipboard(block.innerText);
              });
              block.parentElement.style.position = 'relative';
              block.parentElement.appendChild(button);
            }
          });
        }
      });
    },
    copyToClipboard(code) {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      this.showCopySuccessMessage();
    },
    showCopySuccessMessage() {
      const message = document.createElement('div');
      message.className = 'copy-success-message';
      message.innerText = '已复制到剪切板';
      document.body.appendChild(message);

      setTimeout(() => {
        document.body.removeChild(message);
      }, 2000); 
    },
    toggleSidebar() {
      this.isSidebarVisible = !this.isSidebarVisible;
    },

    selectConversation(index) {
      this.selectedConversationIndex = index;
      this.currentConversation = index;

      if (window.innerWidth <= 600) { 
        this.isSidebarVisible = false;
      }
      
      this.newMessage = '';
      this.$nextTick(() => {
        MathJax.typesetPromise();
        this.highlightCode();
      });
    }
  },
});

app.mount('#app');