document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // 
  document.querySelector('#compose-form').addEventListener('submit', send);

  // By default, load the inbox
  load_mailbox('inbox');
});

function send(event) {
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detailed-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detailed-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch mailbox from server
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      //console.log(emails);

      // List out emails
      emails.forEach( element => {
        const email = document.createElement('div');
        email.className = "list-group-item";
        email.innerHTML = `
          <span class="email_sender">${element.sender}</span>
          <span class="email_subject">${element.subject}</span>
          <span class="email_timestamp">${element.timestamp}</span>
        `;

        // Check if email is readed or unreaded
        email.className += element.read ? " read" : " unread";

        // Check if email is clicked
        email.addEventListener('click', () => {
          view_email(element.id)
        });
        document.querySelector('#emails-view').append(email);
      });
  });

}

function view_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-detailed-view').style.display = 'block';

    // Display email details
    document.querySelector('#email-detailed-view').innerHTML = `
      <div class="email_sender_detailed"><strong>From:</strong> ${email.sender}</div>
      <div class="email_recipients_detailed"><strong>To:</strong> ${email.recipients}</div>
      <div class="email_subject_detailed"><strong>Subject:</strong> ${email.subject}</div>
      <div class="email_timestamp_detailed"><strong>Timestamp:</strong> ${email.timestamp}</div>
      <hr>
      <div class="email_body_detailed">${email.body}</div>
    `;

    // Mark email as read if unread
    if (email.read == false) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }
    
    // Add reply button
    const reply_btn = document.createElement('button');
    reply_btn.className = "btn btn-sm btn-outline-primary my-3 mr-1";
    reply_btn.innerHTML = "Reply";
    reply_btn.addEventListener('click', function() {
      // Load compose page
      compose_email();

      // Fill out composition fields
      document.querySelector('#compose-recipients').value = `${email.sender}`;
      document.querySelector('#compose-subject').value = email.subject.includes("Re:") ? `${email.subject}` : `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;

    });
    document.querySelector('#email-detailed-view').append(reply_btn);

    // Add archive button if user is not the sender
    if (document.querySelector('h2').innerHTML != email.sender ) {
      const archive_btn = document.createElement('button');
      archive_btn.className = "btn btn-sm btn-outline-primary my-3";
      archive_btn.innerHTML = email.archived ? "Unarchive" : "Archive";
      archive_btn.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email.archived
          })
        })
        .then(()=> load_mailbox('inbox'));
      });
      document.querySelector('#email-detailed-view').append(archive_btn);
    }

  });
}
