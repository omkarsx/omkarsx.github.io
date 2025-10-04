// Initialize EmailJS
emailjs.init("lMTFAcuD2JlvF_3AQ"); // Replace with your actual public key

// Define your service and template IDs
const serviceID = "service_kbel4uh";      // e.g., "service_abc123"
const templateID = "template_pn9akwp";    // e.g., "template_xyz789"

// Send email function
function sendEmail() {
    const templateParams = {
        name: document.querySelector("#name").value,
        email: document.querySelector("#email").value,
        message: document.querySelector("#message").value,
    };
    
    emailjs.send(serviceID, templateID, templateParams)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            alert('Message sent successfully!');
            document.getElementById('contactForm').reset();
        }, function(error) {
            console.log('FAILED...', error);
            alert('Failed to send message. Please try again.');
        });
}

// Attach event listener to form
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();
    sendEmail();
});
