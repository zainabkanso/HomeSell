const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const emailInput = document.getElementById("emailInput");
const currentPasswordInput = document.getElementById("currentPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");

if (!getToken()) {
  window.location.href = "auth.html";
}

const loadProfile = async () => {
  try {
    const response = await fetch(`${apiBase}/auth/me`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    const data = await response.json();
    if (!response.ok) {
      showMessage(data.message || "Could not load profile", "danger");
      return;
    }

    nameInput.value = data.name || "";
    phoneInput.value = data.phone || "";
    emailInput.value = data.email || "";
  } catch (error) {
    console.error(error);
    showMessage("Could not load profile", "danger");
  }
};

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();
  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!email) {
    showMessage("Email is required", "danger");
    return;
  }

  if (newPassword && newPassword !== confirmPassword) {
    showMessage("New passwords do not match", "danger");
    return;
  }

  const body = {
    name,
    phone,
    email,
  };

  if (newPassword) {
    body.currentPassword = currentPassword;
    body.newPassword = newPassword;
  }

  try {
    const response = await fetch(`${apiBase}/auth/me`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      showMessage(data.message || "Could not update profile", "danger");
      return;
    }

    showMessage("Profile updated successfully", "success");
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
  } catch (error) {
    console.error(error);
    showMessage("Could not update profile", "danger");
  }
});

loadProfile();
