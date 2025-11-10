document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Add participants section container to the card markup
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            <div class="participants-container"></div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants list (either a styled list or a friendly message)
        const participantsContainer = activityCard.querySelector(".participants-container");
        const participants = Array.isArray(details.participants) ? details.participants : [];

        if (participants.length === 0) {
          const noP = document.createElement("p");
          noP.className = "info";
          noP.textContent = "No participants yet. Be the first to sign up!";
          participantsContainer.appendChild(noP);
        } else {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            // Build initials from the local part of the email (before @)
            const local = (email.split("@")[0] || "").replace(/[^a-zA-Z0-9.\-_]/g, "");
            const initials = local
              .split(/[\.\-_]/)
              .map((s) => (s ? s[0] : ""))
              .join("")
              .slice(0, 2)
              .toUpperCase();
            avatar.textContent = initials || "?";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = email;

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-button";
            deleteButton.textContent = "×";
            deleteButton.title = "Unregister participant";
            
            deleteButton.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                if (response.ok) {
                  li.remove();
                  messageDiv.textContent = `Successfully unregistered ${email} from ${name}`;
                  messageDiv.className = "success";
                } else {
                  const result = await response.json();
                  messageDiv.textContent = result.detail || "Failed to unregister participant";
                  messageDiv.className = "error";
                }

                messageDiv.classList.remove("hidden");
                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 5000);

                // Update spots available
                const activityCard = deleteButton.closest(".activity-card");
                const availabilityP = Array.from(activityCard.children).find(el => 
                  el.tagName === "P" && el.textContent.includes("Availability")
                );
                if (availabilityP) {
                  const details = activities[name];
                  const spotsLeft = details.max_participants - (details.participants.length - 1);
                  availabilityP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
                }
              } catch (error) {
                console.error("Error unregistering:", error);
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(deleteButton);
            ul.appendChild(li);
          });

          participantsContainer.appendChild(ul);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Update the UI to show the new participant
        const activityCard = Array.from(document.querySelectorAll('.activity-card'))
          .find(card => card.querySelector('h4').textContent === activity);

        if (activityCard) {
          const participantsContainer = activityCard.querySelector(".participants-container");
          const existingList = participantsContainer.querySelector(".participants-list");
          const existingMessage = participantsContainer.querySelector(".info");

          // Remove "no participants" message if it exists
          if (existingMessage) {
            existingMessage.remove();
          }

          // Create or update participants list
          let ul = existingList;
          if (!ul) {
            ul = document.createElement("ul");
            ul.className = "participants-list";
            participantsContainer.appendChild(ul);
          }

          // Add the new participant
          const li = document.createElement("li");
          li.className = "participant-item";

          const avatar = document.createElement("span");
          avatar.className = "participant-avatar";
          // Build initials from the local part of the email (before @)
          const local = (email.split("@")[0] || "").replace(/[^a-zA-Z0-9.\-_]/g, "");
          const initials = local
            .split(/[\.\-_]/)
            .map((s) => (s ? s[0] : ""))
            .join("")
            .slice(0, 2)
            .toUpperCase();
          avatar.textContent = initials || "?";

          const nameSpan = document.createElement("span");
          nameSpan.className = "participant-name";
          nameSpan.textContent = email;

          const deleteButton = document.createElement("button");
          deleteButton.className = "delete-button";
          deleteButton.textContent = "×";
          deleteButton.title = "Unregister participant";
          
          deleteButton.addEventListener("click", async () => {
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );

              if (response.ok) {
                li.remove();
                messageDiv.textContent = `Successfully unregistered ${email} from ${activity}`;
                messageDiv.className = "success";
              } else {
                const result = await response.json();
                messageDiv.textContent = result.detail || "Failed to unregister participant";
                messageDiv.className = "error";
              }

              messageDiv.classList.remove("hidden");
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);

              // Update spots available
              const availabilityP = Array.from(activityCard.children).find(el => 
                el.tagName === "P" && el.textContent.includes("Availability")
              );
              if (availabilityP) {
                const details = activities[activity];
                const spotsLeft = details.max_participants - (details.participants.length - 1);
                availabilityP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
              }
            } catch (error) {
              console.error("Error unregistering:", error);
              messageDiv.textContent = "Failed to unregister. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          });

          li.appendChild(avatar);
          li.appendChild(nameSpan);
          li.appendChild(deleteButton);
          ul.appendChild(li);

          // Update the spots available
          const availabilityP = Array.from(activityCard.children).find(el => 
            el.tagName === "P" && el.textContent.includes("Availability")
          );
          if (availabilityP) {
            // Get the activity data
            fetch("/activities")
              .then(response => response.json())
              .then(activities => {
                const details = activities[activity];
                const spotsLeft = details.max_participants - details.participants.length;
                availabilityP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
              });
          }
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
