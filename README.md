# Web-Research-Profile-Management
Welcome to our Academic Net Web application designed to revolutionize the way academic publications and research profiles are managed within the scholarly community. This innovative platform caters to researchers and academic professionals, providing a seamless and efficient solution for handling academic publications and networking with peers.

Key Features:

Publication Management: The application simplifies the process of adding publications and managing associated information. Users can input their publications effortlessly using their names, surnames, or specific publication details, ensuring hassle-free data entry.

Automated Publication Retrieval: Harnessing the power of technology, our application automatically fetches user publications from renowned online sources, saving valuable time and effort.

File Upload Capabilities: Users can upload presentation files and content files for each publication, enabling the dissemination of research findings effectively. The platform offers precise control, allowing users to specify who can access these files.

Enhanced Collaboration: Operating within a robust social network framework, our system promotes networking and collaboration among researchers, academic professionals, teaching staff, and administrators. Users can connect with peers, stay updated on news and publications, and endorse each other's skills, fostering a vibrant academic community.

Quality and User Experience: Our application boasts a feature-rich environment, ensuring a high level of quality in managing academic data. With a user-friendly interface and powerful features, it enhances the overall experience for researchers and members of the academic community.


Watch some actions here :  https://youtu.be/YiPjXM8boso 
and here : https://youtu.be/6utLfX4sVms


Prerequisites to run the project:
  1. Node.js should be installed on the system. You can see official Node.js website to download and install it.
  2. Two Operating System (OS) terminals. One will be used for Front-End and the other for the Back-End.
  3. MySQL Server: MySQL Database Management System should be installed.
  4. MySQL Client. A MySQL client must be installed to be used to create the base of the system.
  5. Git should be installed.



Installation instructions:
  1. With one terminal open we can clone our project's repository from GitHub.We go to the directory of the choice where we want to save the project and
      type it command “git clone https://github.com/ParisSakkoulas/Web-Research-Profile-Management.git”, like shown below in the image below.
     ![image](https://github.com/user-attachments/assets/dc19f324-62ed-4478-99b8-d5a40118f5d3)

  2. Initially in both of the terminals we should be transferred to the space where it was stored our software project on the OS.In the first terminal that will
      be used for the backend, we should go to the server space/subfolder. we will run the command nodemon index.js to start it. We can see the result of
      the execution in the image bellow.
      ![image](https://github.com/user-attachments/assets/d22f8287-c714-494d-8fc9-4f2d945a87aa)

  3. Then, as shown below to start the front end, we use the other terminal to go to the project sub-folder of the project (i.e. it is at the same level as the server sub-folder).
      As we mentioned in the previous chapter, the implementation of the Front End was done using Angular. Generally, to start an angular program, the command “ng serve”.
      However, since this work required the use of TLS certificates, it should type the "npm start" command to install and use the certificates by keys sub-folder of the project.
      ![image](https://github.com/user-attachments/assets/559eae91-b7a8-4fc7-8b74-9de2725ae13a)

  4. Then, we can see that our proposed application is working properly by opening one browser on the local hosting system and typing https://localhost:4200.
     ![image](https://github.com/user-attachments/assets/9e022d72-ed70-4dfa-8ca9-746484875fd7)




Some Functions:

  1. User sign up

  1.1 Visitors can register to the web app using their email. After the submition of the form the visitors press sign up button and the system send them a link to their respective email.
     ![image](https://github.com/user-attachments/assets/438cf657-8258-43cd-b796-0ef6356676d4)
     ![image](https://github.com/user-attachments/assets/55e63c08-f33f-4749-8df6-16458ad649ae)

  1.2 On their email the visitors should press Verify to verify their account. After that the system will display a success message about the verification.
     ![image](https://github.com/user-attachments/assets/a9b14de9-f39a-4fa3-bd28-066998ccbe6e)
     ![image](https://github.com/user-attachments/assets/9df4ac2a-72ec-4eec-96c6-36121cf29728)

  2. User log in
     2.1 User can log in to the web app using either their user name or their email.
     ![image](https://github.com/user-attachments/assets/3cb7749e-763a-444a-aea2-64dc54eaedd9)










