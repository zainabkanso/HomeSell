const socket = io();

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");

const photoInput = document.getElementById("photoInput");
const videoInput = document.getElementById("videoInput");
const recordBtn = document.getElementById("recordBtn");

const attachmentBtn = document.getElementById("attachmentBtn");
const attachmentMenu = document.getElementById("attachmentMenu");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const locationBtn = document.getElementById("locationBtn");

const filePreviewBox = document.getElementById("filePreviewBox");
const filePreviewContent = document.getElementById("filePreviewContent");
const sendFileBtn = document.getElementById("sendFileBtn");
const cancelFileBtn = document.getElementById("cancelFileBtn");

const cameraModal = document.getElementById("cameraModal");
const cameraPreview = document.getElementById("cameraPreview");
const cameraCanvas = document.getElementById("cameraCanvas");
const closeCameraBtn = document.getElementById("closeCameraBtn");
const capturePhotoBtn = document.getElementById("capturePhotoBtn");

let pendingFile = null;
let pendingType = "";
let cameraStream = null;
let mediaRecorder = null;
let audioChunks = [];

const params = new URLSearchParams(window.location.search);
const chatId = params.get("id");

const tokenPayload = getTokenPayload();
const currentUserId = tokenPayload?.userId;

const sendBtn = document.querySelector(".send-btn");

const messageMenu = document.createElement("div");
messageMenu.className = "message-menu";
messageMenu.innerHTML = `
  <button type="button" id="editMessageBtn">Edit Message</button>
  <button type="button" id="deleteMessageBtn">Delete Message</button>
`;
document.body.appendChild(messageMenu);

let activeMessageId = null;
let editMessageId = null;

if (!getToken()) {
  window.location.href = "auth.html";
}

if (!chatId && chatMessages) {
  chatMessages.innerHTML = `<p class="text-danger">Chat not found.</p>`;
}

const scrollToBottom = () => {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
};

const getMessageRowById = (messageId) => {
  return chatMessages?.querySelector(`[data-message-id="${messageId}"]`);
};

const hideMessageMenu = () => {
  messageMenu.style.display = "none";
  activeMessageId = null;
};

const showMessageMenuAt = (x, y, messageId) => {
  activeMessageId = messageId;
  const menuWidth = 180;
  const menuHeight = 90;
  const left = Math.min(x, window.innerWidth - menuWidth - 12);
  const top = Math.min(y, window.innerHeight - menuHeight - 12);

  messageMenu.style.left = `${left}px`;
  messageMenu.style.top = `${top}px`;
  messageMenu.style.display = "flex";
};

const updateRenderedMessage = (message) => {
  const row = getMessageRowById(message._id);
  if (!row) return;

  const textEl = row.querySelector(".message-text");
  if (textEl) {
    textEl.textContent = message.text || "";
  }

  const editedEl = row.querySelector(".message-edited");
  const bubble = row.querySelector(".message-bubble");

  if (message.edited) {
    if (!editedEl && bubble) {
      bubble.insertAdjacentHTML(
        "beforeend",
        `<div class=\"message-edited\">Edited</div>`,
      );
    }
  } else if (editedEl) {
    editedEl.remove();
  }
};

const deleteMessageRow = (messageId) => {
  const row = getMessageRowById(messageId);
  if (row) {
    row.remove();
  }
};

const cancelEdit = () => {
  editMessageId = null;
  if (sendBtn) sendBtn.textContent = "Send";
  messageInput.value = "";
  messageInput.placeholder = "Write your message...";
};

const handleEditMessage = () => {
  if (!activeMessageId) return;

  const row = getMessageRowById(activeMessageId);
  if (!row) return;

  const type = row.dataset.messageType;
  if (type !== "text") {
    alert("Only text messages can be edited.");
    hideMessageMenu();
    return;
  }

  const textEl = row.querySelector(".message-text");
  const currentText = textEl?.textContent?.trim() || "";

  editMessageId = activeMessageId;
  messageInput.value = currentText;
  messageInput.focus();
  messageInput.setSelectionRange(currentText.length, currentText.length);
  if (sendBtn) sendBtn.textContent = "Save";
  messageInput.placeholder = "Edit your message...";
  hideMessageMenu();
};

const handleDeleteMessage = async () => {
  if (!activeMessageId) return;

  const messageId = activeMessageId;

  if (!confirm("Delete this message for both participants?")) {
    hideMessageMenu();
    return;
  }

  hideMessageMenu();

  try {
    const response = await fetch(`${apiBase}/chat/messages/${messageId}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Could not delete message");
      return;
    }

    deleteMessageRow(messageId);
    socket.emit("deleteMessage", {
      chatId,
      messageId,
    });
  } catch (error) {
    console.error(error);
    alert("Could not delete message");
  }
};

messageMenu
  .querySelector("#editMessageBtn")
  .addEventListener("click", handleEditMessage);
messageMenu
  .querySelector("#deleteMessageBtn")
  .addEventListener("click", handleDeleteMessage);

document.addEventListener("click", (event) => {
  if (!messageMenu.contains(event.target)) {
    const row = event.target.closest(".message-row.mine");
    if (!row) {
      hideMessageMenu();
    }
  }
});

chatMessages?.addEventListener("dblclick", (event) => {
  const row = event.target.closest(".message-row.mine");
  if (!row) return;

  showMessageMenuAt(event.clientX, event.clientY, row.dataset.messageId);
});

window.addEventListener("resize", hideMessageMenu);

const showFilePreview = (type, file) => {
  if (!filePreviewBox || !filePreviewContent || !file) return;

  pendingFile = file;
  pendingType = type;

  const url = URL.createObjectURL(file);

  if (type === "image") {
    filePreviewContent.innerHTML = `
      <img src="${url}" class="chat-media-img" alt="preview image" />
    `;
  } else if (type === "video") {
    filePreviewContent.innerHTML = `
      <video controls class="chat-media-video">
        <source src="${url}" type="${file.type}">
      </video>
    `;
  } else if (type === "voice") {
    filePreviewContent.innerHTML = `
      <audio controls src="${url}" class="chat-audio"></audio>
    `;
  }

  filePreviewBox.style.display = "block";
};

const clearFilePreview = () => {
  pendingFile = null;
  pendingType = "";

  if (filePreviewContent) filePreviewContent.innerHTML = "";
  if (filePreviewBox) filePreviewBox.style.display = "none";
};

const sendFileMessage = async (type, file) => {
  if (!file || !chatId) return;

  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);

  try {
    const response = await fetch(`${apiBase}/chat/${chatId}/messages`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });

    const savedMessage = await response.json();

    if (!response.ok) {
      alert(savedMessage.message || `Could not send ${type}`);
      return;
    }

    socket.emit("sendMessage", {
      chatId,
      ...savedMessage,
    });
  } catch (error) {
    console.error(error);
    alert(`Could not send ${type}`);
  }
};

const sendLocationMessage = async () => {
  if (!navigator.geolocation) {
    alert("Location is not supported on this device.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const locationUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      const formData = new FormData();
      formData.append("type", "location");
      formData.append("locationUrl", locationUrl);

      try {
        const response = await fetch(`${apiBase}/chat/${chatId}/messages`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
          body: formData,
        });

        const savedMessage = await response.json();

        if (!response.ok) {
          alert(savedMessage.message || "Could not send location");
          return;
        }

        socket.emit("sendMessage", {
          chatId,
          ...savedMessage,
        });
      } catch (error) {
        console.error(error);
        alert("Could not send location");
      }
    },
    () => {
      alert("Location permission is required.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
};

const renderMessage = (message) => {
  const senderId =
    typeof message.sender === "object" ? message.sender._id : message.sender;

  const senderEmail =
    typeof message.sender === "object" ? message.sender.email : "User";

  const isMine = senderId === currentUserId;

  let content = "";

  if (message.type === "image") {
    content = `
      <img src="${message.fileUrl}" class="chat-media-img" alt="chat image" />
    `;
  } else if (message.type === "video") {
    content = `
      <video controls class="chat-media-video">
        <source src="${message.fileUrl}">
      </video>
    `;
  } else if (message.type === "voice") {
    content = `
      <audio controls src="${message.fileUrl}" class="chat-audio"></audio>
    `;
  } else if (message.type === "location") {
    content = `
      <a href="${message.location?.url}" target="_blank" class="btn btn-sm btn-outline-brand">
        📍 Open Google Maps Location
      </a>
    `;
  } else {
    content = `<div class="message-text">${message.text || ""}</div>`;
  }

  const editedNote = message.edited
    ? `<div class="message-edited">Edited</div>`
    : "";

  const div = document.createElement("div");
  div.className = `message-row ${isMine ? "mine" : ""}`;
  div.setAttribute("data-message-id", message._id);
  div.setAttribute("data-message-type", message.type || "text");

  div.innerHTML = `
    <div class="message-bubble">
      <div class="message-email">
        ${isMine ? "You" : senderEmail}
      </div>
      ${content}
      ${editedNote}
    </div>
  `;

  chatMessages.appendChild(div);
  scrollToBottom();
};

const loadMessages = async () => {
  if (!chatId) return;

  try {
    const response = await fetch(`${apiBase}/chat/${chatId}/messages`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    const messages = await response.json();

    if (!response.ok) {
      chatMessages.innerHTML = `<p class="text-danger">${
        messages.message || "Could not load messages"
      }</p>`;
      return;
    }

    chatMessages.innerHTML = "";
    messages.forEach(renderMessage);
    await fetch(`${apiBase}/chat/${chatId}/read`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
      },
    });
  } catch (error) {
    console.error(error);
    chatMessages.innerHTML = `<p class="text-danger">Error loading chat.</p>`;
  }
};

socket.emit("joinChat", chatId);

socket.on("receiveMessage", (message) => {
  renderMessage(message);
});

socket.on("messageDeleted", (messageId) => {
  deleteMessageRow(messageId);
});

socket.on("messageEdited", (message) => {
  updateRenderedMessage(message);
});

chatForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();
  if (!text) return;

  if (editMessageId) {
    try {
      const response = await fetch(
        `${apiBase}/chat/messages/${editMessageId}`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        },
      );

      const editedMessage = await response.json();

      if (!response.ok) {
        alert(editedMessage.message || "Could not save edited message");
        return;
      }

      updateRenderedMessage(editedMessage);
      socket.emit("editMessage", {
        chatId,
        message: editedMessage,
      });
    } catch (error) {
      console.error(error);
      alert("Could not save edited message");
    } finally {
      cancelEdit();
    }

    return;
  }

  const formData = new FormData();
  formData.append("type", "text");
  formData.append("text", text);

  messageInput.value = "";

  try {
    const response = await fetch(`${apiBase}/chat/${chatId}/messages`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });

    const savedMessage = await response.json();

    if (!response.ok) {
      alert(savedMessage.message || "Could not send message");
      return;
    }

    socket.emit("sendMessage", {
      chatId,
      ...savedMessage,
    });
  } catch (error) {
    console.error(error);
    alert("Could not send message");
  }
});

messageInput?.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editMessageId) {
    cancelEdit();
  }
});

attachmentBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  attachmentMenu?.classList.toggle("show");
});

document.addEventListener("click", (event) => {
  if (
    attachmentMenu &&
    attachmentBtn &&
    !attachmentMenu.contains(event.target) &&
    !attachmentBtn.contains(event.target)
  ) {
    attachmentMenu.classList.remove("show");
  }
});

photoInput?.addEventListener("change", () => {
  const file = photoInput.files[0];

  if (file) showFilePreview("image", file);

  attachmentMenu?.classList.remove("show");
  photoInput.value = "";
});

videoInput?.addEventListener("change", () => {
  const file = videoInput.files[0];

  if (file) showFilePreview("video", file);

  attachmentMenu?.classList.remove("show");
  videoInput.value = "";
});

locationBtn?.addEventListener("click", () => {
  attachmentMenu?.classList.remove("show");

  const confirmed = confirm("Send your current location?");
  if (!confirmed) return;

  sendLocationMessage();
});

cancelFileBtn?.addEventListener("click", () => {
  clearFilePreview();
});

sendFileBtn?.addEventListener("click", async () => {
  if (!pendingFile || !pendingType) return;

  await sendFileMessage(pendingType, pendingFile);
  clearFilePreview();
});

takePhotoBtn?.addEventListener("click", async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera is not supported on this device/browser.");
      return;
    }

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    if (cameraPreview) {
      cameraPreview.srcObject = cameraStream;
    }

    if (cameraModal) {
      cameraModal.style.display = "flex";
    }

    attachmentMenu?.classList.remove("show");
  } catch (error) {
    console.error(error);
    alert(error.name + ": " + error.message);
  }
});

const closeCamera = () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  if (cameraPreview) cameraPreview.srcObject = null;
  if (cameraModal) cameraModal.style.display = "none";
};

closeCameraBtn?.addEventListener("click", () => {
  closeCamera();
});

capturePhotoBtn?.addEventListener("click", () => {
  if (!cameraPreview || !cameraCanvas) return;

  cameraCanvas.width = cameraPreview.videoWidth;
  cameraCanvas.height = cameraPreview.videoHeight;

  const context = cameraCanvas.getContext("2d");
  context.drawImage(cameraPreview, 0, 0);

  cameraCanvas.toBlob(
    (blob) => {
      if (!blob) return;

      const photoFile = new File([blob], "camera-photo.jpg", {
        type: "image/jpeg",
      });

      closeCamera();
      showFilePreview("image", photoFile);
    },
    "image/jpeg",
    0.9,
  );
});

recordBtn?.addEventListener("click", async () => {
  try {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, {
          type: "audio/webm",
        });

        const voiceFile = new File([audioBlob], "voice-note.webm", {
          type: "audio/webm",
        });

        showFilePreview("voice", voiceFile);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      recordBtn.innerHTML = "⏹";
      recordBtn.classList.add("recording");
    } else {
      mediaRecorder.stop();
      recordBtn.innerHTML = "🎤";
      recordBtn.classList.remove("recording");
    }
  } catch (error) {
    console.error(error);
    alert("Microphone permission is required.");
  }
});

loadMessages();
