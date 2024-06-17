const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer");
const Profile = require("../models/Profile/Profile");
const { user } = require("scholarly");
const Category = require("../models/Publication/Category");
const fs = require('fs');
const { Sequelize, Op } = require('sequelize');
const ExternalAuthor = require("../models/ExternalAuthor");
const Ability = require("../models/Profile/Ability");
const Job = require("../models/Profile/Jobs");
const ResearchInterest = require("../models/Profile/ResearchInterest");
const Studies = require("../models/Profile/Studies");
const Organization = require("../models/Profile/Organization");
const PhotoProfile = require("../models/Profile/PhotoProfile");
const path = require('path');
const ProfileStats = require("../models/Profile/ProfileStats");
const Publication = require("../models/Publication/Publication");
const PublicationsPerYear = require("../models/Profile/PublicationsPerYear");
const PublicationPlace = require("../models/Publication/PublicationPlace");
const PublicationStats = require("../models/Publication/PublicationStats");
const Network = require("../models/Profile/Networks");
const NetworkCooperations = require("../models/Profile/NetworkCooperations");
const NetworkTopCooperations = require("../models/Profile/NetworkTopCooperations");
const InternalReference = require("../models/Publication/InternalReference");
const NetworkReferences = require("../models/Profile/NetworkReferences");
const NetworkTopReferences = require("../models/Profile/NetworkTopReferences");
const Notification = require("../models/Notification");
const Endorse = require("../models/Endorse");
const Rating = require("../models/Rating");
const RequestFile = require("../models/Files/RequestFile");
const ContentFile = require("../models/Files/ContentFile");
const PresentantionFile = require("../models/Files/PresentantionFile");
const ProfileView = require("../models/Profile/ProfileView");

// Δημιουργία transporter αντικειμένου που θα χρησιμοποιήσουμε για την αποστολή του verification code στο email χρήστη
let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'yourEmailExampl@gmail.com',
    pass: 'YourPasswor'
  }
});

Sequelize.Op = Op;
const operatorsAliases = {
  $like: Op.like,
  $not: Op.not
}



//Μέθοδος για την εγγραφή νέου χρήστη
exports.register_new_user = (req, res, next) => {



  // Χρήση μεθόδου hash για την κρυπτογράφηση του κωδικού του χρήστη
  const hash = bcrypt.hash(req.body.password, 15).then(async hash => {


    // Δημιουργία αντικειμένου token που θα στείλουμε στον χρήστη για ενεργοποίηση του λογαριασμού του
    const token = jwt.sign({
      data: 'Data token'
    },
      'ourSecretKey',

      { expiresIn: '10m' }

    )

    //Δημιουργία αντικειμένου newUser με τα στοιχεία που στέλνει ο client
    const newUser = {
      email: req.body.email,
      password: hash,
      userName: req.body.userName,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      uniqueString: token
    }

    const userWithSameEmail = await User.findOne({ where: { email: newUser.email } });
    if (userWithSameEmail) {
      return res.status(400).json({
        message: 'Email already in use'
      })
    }

    const userWithSameUserName = await User.findOne({ where: { userName: newUser.userName } });
    if (userWithSameUserName) {
      return res.status(400).json({
        message: 'User name already in use'
      })
    }

    // Δημιουργία αντικειμένου mailOptions που θα έχει τα στοιχεία που στέλνουμε το mail
    let mailOptions = {
      from: 'academicnetsp@gmail.com',
      to: newUser.email, // email χρήστη
      subject: 'Email Configuration',
      html: `<table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="80%" cellpadding="0" cellspacing="0" style="background-color: #86CBFC;">
            <tr>
              <td align="center" style="padding: 3%;">
                <h1 style="color: white; line-height: 160%;">AcademicNet</h1>
                <h1 style="color: white;">Hello, ${newUser.firstName} ${newUser.lastName}</h1>
              </td>
            </tr>
            <tr>
              <td align="center" style="margin-top: 10%;">
                <h1 style="line-height: 150%; margin-bottom: 8%;">Please click the button below to verify your email address.</h1>
                <a href="https://localhost:4200/verify/${token}" style="text-decoration: none; color: inherit; width: 30%; display: block; height: 50px; line-height: 50px; text-align: center; background-color: white; font-weight: 600; font-size: 20px; border-radius: 15px;">Verify</a>
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size: 20px;">
                <p>Thanks,</p>
                <p>Academic Net support</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
    };


    //Δημιουργία αντικειμένου χρήστη στην βάση. Αφού δημιουργηθεί στέλνουμε στον χρήστη το μήνυμα στο email του με ένα link για ενεργοποίηση του λογαριασμού του.
    User.create(newUser).then(async userCreated => {





      // send mail with defined transport object
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          await userCreated.destroy();
        } else {
          console.log('Message sent: %s', info.messageId);


        }
      });


      return res.status(200).json({
        message: `A confirmation mail has sent to ${userCreated.email}. Check your email!`,
        user: userCreated,
      })



    }).catch(err => {

      console.log(err)
      console.log(err.errors[0].message)

      let costumeMessage = '';

      if (err.errors[0].message)
        switch (err.errors[0].message) {

          case 'email must be unique':
            costumeMessage = 'The email is already in use'
            break;

          case 'userName must be unique':
            costumeMessage = 'The user name is already in use'
            break;

          default:
            costumeMessage = 'Unknown error'
            break;
        }

      res.status(400).json({
        message: 'Invalid authentication credentials. ' + costumeMessage,
        error: err.errors[0].message
      })


    })



  });






}

//Μέθοδος για την σύνδεση χρήστη
exports.log_in_user = async (req, res, next) => {



  console.log("LOG IN STARTED")


  let userFound
  //Αποθηκεύουμε στην μεταβλητή loginCredentials το loginCredentials που στέλνει ο χρήστης. Μπορεί να είναι είτε το email είτε το userName του.
  const loginCredentials = req.body.loginCredentials;

  if (!loginCredentials) {
    return res.status(401).json({
      message: 'Invalid authentication credentials'
    })
  }


  //έπειτα ελέγχουμε μέσω της inlude μεθόδου αν το loginCredentials περιέχει το '@' και το αποθηκεύουμε στην μεταβλητή isEmail.
  const isEmail = loginCredentials.includes('@');

  //Έπειτα ανάλογα με την boolean τιμή της email έχουμε. Αν είναι true αποθηκεύουμε την τιμή email στο search Phrase, διαφορετικά το userName.
  const searchPhrase = isEmail ? 'email' : 'userName';

  console.log(searchPhrase);

  //Μετά ψάχνουμε στην βάση να βρούμε το χρήστη με βάση είτε το email είτε το userName
  User.findOne({ where: { [searchPhrase]: loginCredentials } }).then(async user => {

    userFound = user;

    //Αν δεν βρεθεί ο χρήστη στέλνουμε στον client ότι δεν έγινε η αυθεντικοποίηση
    if (!user) {
      return res.status(401).json({
        message: 'User not found'
      })
    }


    const result = await bcrypt.compare(req.body.password, userFound.password);
    console.log(result);



    //Αν το αποτέλεσμα της συνάρτησης compare είναι false τότε στέλνουμε στον client ότι δεν έγινε η αυθεντικοποίηση
    if (!result) {

      //Αρχικά ελέγχουμε αν οι προσπάθειες χρήστη για σύνδεση είναι μεγαλύτερες η ίσες του 3.
      // αν είναι τότε αρχικά αλλάζουμε την κατάσταση του χρήστη σε Inactive και στην συνέχεια στέλνουμε στον client
      // ότι ο λογαριασμός χρήστη απενεργοποιήθηκε
      if (userFound.loginAttemps >= 3) {

        await User.update({ userStatus: 'Inactive' }, { where: { [searchPhrase]: loginCredentials } })

        return res.status(401).json({
          message: 'Your account has been blocked. Please contact Academic Net Support for assistance.'
        })

      }

      //εφόσον το result είναι false αυτό σημαίνει ότι έγινε λάθος στον κωδικό οπότε αυξάνουμε το loginAttemps κατα 1
      await User.increment('loginAttemps', { by: 1, where: { [searchPhrase]: loginCredentials } });



      return res.status(401).json({
        message: 'Invalid authentication credentials'
      })
    }

    //Διαφορετικά
    else {

      //Αν η κατάσταση του λογαριασμού του χρήστη είναι μη ενεργή (!=Active). Τότε δεν επιτρέπεται η σύνδεση
      if (userFound.userStatus != 'Active') {
        return res.status(401).json({
          message: "Pending Account. Please Verify Your Email!",
        })
      }


      //Διαφορετικά αν είναι ενεργή η κατάσταση του λογαριασμού του, υπογράφουμε το τοκεν που θα στείλουμε στον client
      console.log("USER LOG IN", userFound);
      await User.update({ loginAttemps: 0 }, { where: { [searchPhrase]: loginCredentials } })
      const token = jwt.sign({ emai: userFound.email, userId: userFound.user_id, userStatus: userFound.userStatus, userRole: userFound.userRole },
        'AcasdDsdfaaxcvSDFsdfsdSDFSDfXCVSDfsdSDfsdsdARWERYUmnmJKGHjhg',
        { expiresIn: '1h' }
      );

      //Αποστολή στοιχείων και μηνύματος επιτυχίας στον client
      res.status(200).json({
        message: 'Auth success',
        token: token,
        expiresIn: 3600,
        userId: userFound.user_id,
        email: userFound.email,
        userName: userFound.userName,
        firstName: userFound.firstName,
        lastName: userFound.lastName,
        userStatus: userFound.userStatus,
        userRole: userFound.userRole,
      })
    }

  }).catch(err => {

    console.log(err)
    res.status(401).json({
      err: err,
      message: 'Invalid authentication credentials'
    })


  })


}

//Μέθοδος για την ενεργοποίηση ενός λογαριασμού χρήστη
exports.verify_user = async (req, res, next) => {

  //Αποθήκευση confirmationCode που βρίσκεται στο url στην μεταβλητή uniqueString
  const uniqueString = req.params.confirmationCode;

  //Verify token
  jwt.verify(uniqueString, 'ourSecretKey', async (err, decodedToken) => {

    //Αν υπάρξει κάποιο λάθος με το λινκ ή το duration του code έχει λήξει
    if (err) {
      res.status(201).json({
        type: 'Failed',
        message: "Email verification failed, possibly the link is invalid or expired. You can choose to resend you a new verification code!"
      });
    }

    //Διαφορετικά αλλάζουμε την κατάσταση του λογαριασμού του χρήστη σε ενεργή
    else {

      const user = await User.findOne({ where: { uniqueString: uniqueString } });

      if (user) {


        //Βρίσκουμε τον χρήστη και
        await User.update({ userStatus: 'Active', loginAttemps: 0 }, { where: { uniqueString: uniqueString } });


        console.log(user.user_id)

        //Δημιουργία της πρώτης Default κατηγορίας για όλες τις δημοσιεύσεις
        const allCategory = await Category.create({ name: 'All', state: 'All' });
        await allCategory.setUser(user);

        //Δηνμιουργία της δεύτερης Default κατηγορίας για τις δημοσιέυσεις που δεν έχουν κατηγορία
        const uncategorized = await Category.create({ name: 'Uncategorized', state: 'Uncategorized' });
        await uncategorized.setUser(user);


        //Δημιουργία αντικειμένου Προφιλ για τον χρήστη που μόλις δημιουργήσαμε
        const profileCreated = await user.createProfile({});


        //Δημιουργία του default stat για τα προφιλ
        const profileStatsCreated = await ProfileStats.create({
          total_publications: 0,
          publicationsPerYear: 0,
          num_of_profile_views: 0,
          num_of_citations: 0,
          citationsPerYear: 0,
          hIndex: 0,
          followers: 0,
          i_10index: 0,
          rating: 0,
        })

        console.log(profileStatsCreated);
        console.log(profileCreated);

        await profileStatsCreated.setProfile(profileCreated);



        //Δημιουργία Network αντικειμένου και συσχέτιση αυτού με το Profile
        const network = await Network.create({});
        await profileCreated.setNetwork(network)







        //Δημιουργία Φακέλου για τον χρήστη
        let folderPath = './uploads/' + user.user_id;
        fs.mkdir(folderPath, function (err) {
          if (err) {
            folderPath = './uploads/' + user.user_id + user.firstName + user.lastName
            fs.mkdir(folderPath, function (err) {

            })

          } else {
            console.log("New directory successfully created.")
          }
        })






        if (profileCreated) {


          const newObjProfilePhoto = {
            filename: 'user.png',
            type: '.png',
            path: './uploads/defaultPhotoProfile/user.png'
          }



          const photoSaved = await PhotoProfile.create(newObjProfilePhoto);
          //Συσχέτιση profile με το αρχείο
          await profileCreated.setPhotoProfile(photoSaved);



        }




        res.status(201).json({
          type: 'Success',
          message: 'User email verified. You can now log in!'
        })

      } else {

        console.log('User not found')

        res.status(201).json({
          message: 'Cant find user with this email'
        })

      }

    }


  })






}

//Μέθοδος για την επαναποστολή verification code σε κάποιον χρήστη με απενεργοποιημένο λογαριασμό.
// Θα χρησιμοποιείται είτε αν ο λογαριασμός έχει μπλοκαριστεί είτε αν το λινκ για ενεργοποίηση έχει λήξει
exports.resend_verification_code = (req, res, next) => {


  //Αποθήκευση email
  const emailToSend = req.body.email;

  //Δημιουργία τοκεν
  const token = jwt.sign({
    data: 'Data token'
  },
    'ourSecretKey',

    { expiresIn: '10m' }

  )

  //ανανέωση uniqueString χρήστη με το τοκεν που φτιάξαμε πιο πάνω
  User.update({ uniqueString: token }, { where: { email: emailToSend } }).then(result => {

    console.log(result)


  });

  // mail αντικείμενο
  let mailOptions = {
    from: 'academicnetsp@gmail.com',
    to: emailToSend,
    subject: 'Email Configuration',
    html: `Press <a href=http://localhost:3000/users/verify/${token}> here </a> to verify your email. Thank you!` // html body
  };

  // Αποστολή μηνύματος στο email του χρήστη
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Message sent: %s', info.messageId);
    }
  });


  //Αποστολή επιβεβαίωσης
  return res.status(200).json({
    message: 'Link send to email. Please check your email!'
  })

}


//Μέθοδος για τον έλεγχο αν ένα usename χρησιμοποιείται ήδη
exports.check_user_name = (req, res, next) => {

  const userName = req.params.userName;

  console.log(userName)

  User.findOne({ where: { userName: userName } }).then(userFound => {

    if (userFound) {
      console.log(userFound)
      return res.json({ taken: true });
    }

    return res.json({ taken: false });
  });


}


//Μέθοδος για τον έλεγχο αν ένα email χρησιμοποιείται ήδη
exports.check_email = (req, res, next) => {

  const email = req.params.email;

  User.findOne({ where: { email: email } }).then(userFound => {

    if (userFound) {
      console.log(userFound)
      return res.json({ taken: true });
    }

    return res.json({ taken: false });
  });


}


exports.get_user_meta_data = async (req, res, next) => {

  console.log(req.userData.userId)


  let userMetaData;


  const userFound = await User.findByPk(req.userData.userId);

  userMetaData = {

    firstName: userFound.firstName,
    lastName: userFound.lastName,
    userName: userFound.userName,
    email: userFound.email,
    user_id: userFound.user_id

  }


  if (userFound) {

    res.status(200).json({
      user: userMetaData,
      message: 'User found!'
    })

  }

  else {
    res.status(400).json({
      message: 'User not found!'
    })
  }



}



exports.get_live_users = async (req, res, next) => {

  const query = req.body.query;


  let resultForUserNameBased = await User.findAll({
    where: {
      userName: {
        [Op.like]: `${query.toLowerCase()}%`
      }
    },
    attributes: ['userName', 'firstName', 'lastName', 'user_id']
  });


  let resultForFirstNameBased = await User.findAll({
    where: {
      firstName: {
        [Op.like]: `${query.toLowerCase()}%`
      }
    },
    attributes: ['userName', 'firstName', 'lastName', 'user_id']
  });


  let resultForLastNameBased = await User.findAll({
    where: {
      lastName: {
        [Op.like]: `${query.toLowerCase()}%`
      }
    },
    attributes: ['userName', 'firstName', 'lastName', 'user_id']
  })


  let resultForFirstNameExternalBased = await ExternalAuthor.findAll({
    where: {
      firstName: {
        [Op.like]: `${query.toLowerCase()}%`
      }
    },
    attributes: ['firstName', 'lastName', 'externalAuthor_id']
  });


  let resultForLastNameExternalBased = await ExternalAuthor.findAll({
    where: {
      lastName: {
        [Op.like]: `${query.toLowerCase()}%`
      }
    },
    attributes: ['firstName', 'lastName', 'externalAuthor_id']
  });

  console.log(resultForFirstNameExternalBased)
  console.log(resultForLastNameExternalBased)




  if (resultForUserNameBased.length > 0 || resultForFirstNameBased.length > 0 || resultForLastNameBased.length > 0 || resultForFirstNameExternalBased.length > 0 || resultForLastNameExternalBased.length > 0) {
    res.status(200).json({
      resultForUserNameBased: resultForUserNameBased,
      resultForFirstNameBased: resultForFirstNameBased,
      resultForLastNameBased: resultForLastNameBased,
      resultForFirstNameExternalBased: resultForFirstNameExternalBased,
      resultForLastNameExternalBased: resultForLastNameExternalBased
    })
  }

  //Αν δεν βρεθεί κάποιος εσωτερικό χρήστης τότε θα πρέπει να ψάξουμε από τις πηγές
  else {

    res.status(200).json({
      message: 'External Results'
    })

  }



}

exports.get_live_external_authors = async (req, res, next) => {
  const query = req.body.query;

  let resultForFirstNameExternalBased = await ExternalAuthor.findAll({
    where: {
      firstName: {
        [Op.like]: `${query.toLowerCase()}%`
      }
    },
    attributes: ['firstName', 'lastName', 'externalAuthor_id']
  });


  let resultForLastNameExternalBased = await ExternalAuthor.findAll({
    where: {
      lastName: {
        [Op.like]: `${query.toLowerCase()}%`
      }
    },
    attributes: ['firstName', 'lastName', 'externalAuthor_id']
  });


  if (resultForFirstNameExternalBased.length > 0 || resultForLastNameExternalBased.length > 0 || resultForLastNameBased.length > 0) {
    res.status(200).json({
      resultForFirstNameExternalBased: resultForFirstNameExternalBased,
      resultForLastNameExternalBased: resultForLastNameExternalBased
    })
  }

  //Αν δεν βρεθεί κάποιος εσωτερικό χρήστης τότε θα πρέπει να ψάξουμε από τις πηγές
  else {

    res.status(200).json({
      message: 'External Results'
    })

  }

}

exports.add_external_author = async (req, res, next) => {


  const externalAuthorObj = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  }

  const externalAuthorCreated = await ExternalAuthor.create(externalAuthorObj);
  const currentUser = await User.findByPk(req.userData.userId)

  if (externalAuthorCreated && currentUser) {
    await currentUser.addExternalauthor(externalAuthorCreated);
    res.status(200).json({
      message: 'Author created successfully',
      author: externalAuthorCreated,
    })
  }

  else {
    res.status(400).json({
      message: 'An error occured'
    })
  }


}


async function compute_profile_stats(id) {


  console.log("Computing profile stats", id)

  const userFound = await User.findByPk(id)

  const userToCompute = await User.findByPk(id, {
    include: [{
      model: User,
      as: 'followers',
      through: { attributes: [] }
    },
    {
      model: User,
      as: 'following', // This should match the association alias 'following'
      through: { attributes: [] } // Don't include any attributes from the join table
    }]
  })


  const profileFound = await Profile.findOne({ where: { userId: userFound.user_id } });


  if (userFound && profileFound) {


    //Υπολογισμός των συνολικών Δημοσιεύσεων
    let total_publications = await userFound.getInternalAuthoredPublications();

    console.log("userFound", userFound)

    console.log("TOTAL PUBLICATIONS", total_publications.length)


    ///Υπολογισμός συνολικών citation 
    let total_citation = 0;
    let publications_cite = [];
    let citationsPerYear = {};
    for (let publication of total_publications) {

      //Υπολογισμός συνολικών citation

      let publication_stat = await publication.getPublicationStat();
      console.log("getPublicationStat", publication_stat)
      if (publication_stat) {

        total_citation += publication_stat.citations;


        //Προσθήκη εκάστωτε citation σε έναν πίνακα μαζί με το ιδ
        publications_cite.push({
          publication_stats_id: publication_stat.publication_stats_id,
          citations: publication_stat.citations,
        })

        //Υπολογισμός cites by year 

        const statsByYear = await PublicationStats.findAll({
          attributes: [
            [Sequelize.col('Publication.year'), 'year'], // Include the year column from Publication model
            [Sequelize.fn('COUNT', Sequelize.col('Publication.publication_id')), 'publicationCount'],
            [Sequelize.fn('SUM', Sequelize.col('PublicationStats.citations')), 'totalCitations'],
          ],
          where: { publicationId: publication.publication_id },
          include: {
            model: Publication,
            attributes: [], // Include the Publication model without any additional attributes
          },
          group: [Sequelize.col('Publication.year')], // Group by the year column from Publication model
        });

        for (let citationPerYear of statsByYear) {
          const year = citationPerYear.dataValues.year;
          const cite = citationPerYear.dataValues.totalCitations;
          citationsPerYear[year] = cite;
        }

      }


    }






    //Υπολογισμός h index
    let h_index = 0;
    publications_cite.sort((a, b) => b.citations - a.citations);
    for (let i = 0; i < publications_cite.length; i++) {
      if (publications_cite[i].citations >= i + 1) {
        h_index = i + 1;
      } else {
        break;
      }
    }

    //Υπολογισμός 10-i index
    let i10Index = 0;
    publications_cite.sort((a, b) => b.citations - a.citations);
    for (const publication of publications_cite) {
      if (publication.citations >= 10) {
        i10Index++;
      } else {
        break;
      }
    }





    //Ομαδοποίηση όλων των δημοσιεύσεων με κοινές χρονολογίες
    const publicationsGroup = await Publication.findAll({
      attributes: ['year', [Sequelize.fn('COUNT', Sequelize.col('publication_id')), 'itemCount']],
      where: {
        userId: id// Add this condition
      },
      group: ['year'],
    });
    //Έπειτα διατρέχουμε το ομαδοποιημένου group για να εισάγουμε τιμές σαν json αντικείμενα στο αντικείμενο publicationsPerYear
    let publicationsPerYear = {};
    for (let publicationGroup of publicationsGroup) {

      //publications
      const year = publicationGroup.dataValues.year;
      const numberOfPublications = publicationGroup.dataValues.itemCount;
      publicationsPerYear[year] = numberOfPublications;


      //citations



    }









    let publicationsPerYearToSet = publicationsPerYear;
    let profile_views = 0;

    let citations = total_citation;

    let hIndex = h_index;

    let i10index = i10Index;

    let followers = 0;
    let following = 0;


    let rating = 0;

    const obj = {
      total_publications: total_publications.length,
      num_of_profile_views: profile_views,
      publicationsPerYear: publicationsPerYearToSet,
      num_of_citations: citations,
      citationsPerYear: citationsPerYear,
      hIndex: hIndex,
      i_10index: i10index,
      followers: userToCompute.followers.length,
      following: userToCompute.following.length,
      rating: rating
    }



    const profileStatFound = await ProfileStats.findOne({ where: { profileId: profileFound.profile_id } });

    if (profileStatFound) {
      profileStatFound.total_publications = obj.total_publications;
      profileStatFound.num_of_profile_views = profile_views;
      profileStatFound.publicationsPerYear = publicationsPerYearToSet;
      profileStatFound.num_of_citations = citations;
      profileStatFound.citationsPerYear = citationsPerYear;
      profileStatFound.hIndex = hIndex;
      profileStatFound.i_10index = i10index;
      profileStatFound.followers = obj.followers;
      profileStatFound.following = obj.following;
      profileStatFound.rating = rating;

      await profileStatFound.save();

    }



  }


  else {
    console.log("user not found")
  }





  //Καθαρισμός όλων των στατιστικών του Προφιλ αν έχουν κενό publicationId
  const profileStatsWithNullPublicationId = await ProfileStats.findAll({ where: { profileId: null } });
  for (let stat of profileStatsWithNullPublicationId) {
    await stat.destroy();
  }





}


async function compute_profile_network(id) {


  //Παίρνουμε τον χρήστη μαζί με τις δημοσιεύσεις του
  const userFound = await User.findByPk(id);

  //εύρεση προφίλ χρήστη που θα μας χρειαστεί παρακάτω
  const profileFound = await Profile.findOne({ where: { userId: userFound.user_id } });

  //εύρεση δικτύου χρήστη
  const networkFound = await Network.findOne({ where: { profileId: profileFound.profile_id } })



  if (userFound && profileFound) {



    //ΓΙΑ ΤΙΣ ΔΗΜΟΣΙΕΎΣΕΙΣ ΠΟΥ ΕΙΝΑΙ ΣΥΝ ΣΥΓΓΡΑΦΕΑΣ
    const userFound2 = await User.findByPk(id, {
      include: [{
        model: Publication,
        as: 'internalAuthoredPublications'
      }]
    });


    const internalAuthoredPublications = await userFound2.getInternalAuthoredPublications()

    //παιρνουμε τα ιδ των δημοσιεύσεων στις οποίεσ συνεργάζετε
    let publicationIds = [];
    let publications = [];

    //Διατρέχουμε τον πίνακα internalAuthoredPublications και με βάση τα ιδ παίρνουμε τις δημοσιεύσεις μαζί με του users - συγγραφείς
    for (let internalAuthoredPublication of internalAuthoredPublications) {
      publicationIds.push(internalAuthoredPublication.publicationinternalauthors.publicationId)
      const publication = await Publication.findByPk(internalAuthoredPublication.publicationinternalauthors.publicationId, {
        include: [{
          model: User,
          as: 'internalAuthors',
        }]
      });

      //προσθέτουμε τισ δημοσιεύσεις στον πίνακα publications
      publications.push(publication)
    }


    let authors1 = [];
    let ref1 = [];
    let internalAuthorsRefs = []
    //Διατρέχουμε τα publications
    for (let publication of publications) {

      //Παιρνουμε τους internal authors κάθε δημοσίευσης
      const internalAuthors = await publication.internalAuthors;

      if (internalAuthors) {

        //διατρέχουμε τον πίνακα internalAuthors
        internalAuthors.map(author => {

          const obj = {
            user_id: author.user_id,
            email: author.email,
            firstName: author.firstName,
            lastName: author.lastName,
            userName: author.userName,
            frequency: 1
          }

          //τοποθετούμε όλους τους internal εκτός του τρέχοντος χρήστη
          if (userFound.user_id !== author.user_id) {
            //βλέπουμε αν υπάρχει, αν ναι αύξηση την συχνότητη αν όχι απλά πρόσθεσε τον στον πίνακα
            const existingAuthor = authors1.find(a => a.user_id === author.user_id);
            if (existingAuthor) {
              existingAuthor.frequency++;
            } else {
              authors1.push(obj);
            }
          }





        })
      }



      ///Υπολογισμός αναφερόμενων συγγραφέων του ερευνητή

      const publicationsWithTargetReferences = await InternalReference.findAll({ where: { referencePublicationId: publication.publication_id } })


      for (let ref of publicationsWithTargetReferences) {


        const publication = await Publication.findByPk(ref.publicationPublicationId, {
          include: [{
            model: User,
            as: 'internalAuthors',
          }]
        });

        //Παιρνουμε τους internal authors κάθε δημοσίευσης
        const internalAuthors = await publication.internalAuthors;

        internalAuthors.map(author => {

          const obj = {
            user_id: author.user_id,
            email: author.email,
            firstName: author.firstName,
            lastName: author.lastName,
            userName: author.userName,
            frequency: 1
          }

          //τοποθετούμε όλους τους internal εκτός του τρέχοντος χρήστη
          if (userFound.user_id !== author.user_id) {
            //βλέπουμε αν υπάρχει, αν ναι αύξηση την συχνότητη αν όχι απλά πρόσθεσε τον στον πίνακα
            const existingAuthor = internalAuthorsRefs.find(a => a.user_id === author.user_id);
            if (existingAuthor) {
              existingAuthor.frequency++;
            } else {
              internalAuthorsRefs.push(obj);
            }
          }

        })



      }
    }



    internalAuthorsRefs.map(author => {
      console.log("Ainternal", author)
    })

    let authorsIdCoop = []
    authors1.map(author => {
      console.log("authors1`1", author)
      authorsIdCoop.push(author.user_id)
    })

    //Ταξινόμηση πίνακα με βάση την συχνότητα του αντικειμένου
    authors1.sort((a, b) => b.frequency - a.frequency);
    //Παίρνουμε τα 5 πρώτα
    const topFiveAuthors = authors1.slice(0, 3);
    console.log("topFiveAuthors`1", topFiveAuthors)



    //Διαδικασία αφαίρεσης  NetworkCooperations που δεν υπάρχουν πια
    let networkCoopId = []
    const networkCooperationFound1 = await NetworkCooperations.findAll({ where: { networkNetworkId: networkFound.network_id } })

    console.log("networkCooperationFound1", networkCooperationFound1)

    for (let networkCooperation of networkCooperationFound1) {
      networkCoopId.push(networkCooperation.userUserId)
    }


    console.log("authorsIdCoop", authorsIdCoop);
    console.log("networkCoopId", networkCoopId);


    for (const id of networkCoopId) {
      if (!authorsIdCoop.includes(id)) {
        const networkCooperationFound = await NetworkCooperations.findOne({ where: { userUserId: id } });
        if (networkCooperationFound) {
          networkCooperationFound.destroy();
          networkCooperationFound.save();
        }
      }
    }


    //Διαδικασία αφαίρεσης  NetworkCooperations που δεν υπάρχουν πια
    let networkRefId = []
    const networkReferencesFound1 = await NetworkReferences.findAll({ where: { networkNetworkId: networkFound.network_id } })
    for (let networkReference of networkReferencesFound1) {
      networkRefId.push(networkReference.userUserId)
    }
    for (const id of networkRefId) {
      if (!authors1.includes(id)) {
        const networkReferenceFound = await NetworkReferences.findOne({ where: { userUserId: id } });
        if (networkReferenceFound) {
          networkReferenceFound.destroy();
          networkReferenceFound.save();
        }
      }
    }








    //Δημιουργία αντικειμένων - Ενημέρωση αντικειμένων για Συνεργάτες
    for (let author of authors1) {

      const networkCooperationFound = await NetworkCooperations.findOne({
        where: {
          networkNetworkId: networkFound.network_id,
          userUserId: author.user_id,
        }
      });



      if (networkCooperationFound) {
        networkCooperationFound.frequency = author.frequency;
        networkCooperationFound.save()
      }
      else {

        await NetworkCooperations.create({
          networkNetworkId: networkFound.network_id,
          userUserId: author.user_id,
          frequency: author.frequency
        })

      }

    }

    //Δημιουργία αντικειμένων - Ενημέρωση αντικειμένων ια  Τοπ Συνεργάτες
    for (let author of topFiveAuthors) {

      const networkCooperationFound = await NetworkTopCooperations.findOne({
        where: {
          networkNetworkId: networkFound.network_id,
          userUserId: author.user_id,
        }
      });

      if (networkCooperationFound) {
        networkCooperationFound.frequency = author.frequency;
        networkCooperationFound.save()
      }
      else {

        await NetworkTopCooperations.create({
          networkNetworkId: networkFound.network_id,
          userUserId: author.user_id,
          frequency: author.frequency
        })

      }

    }







    //Δημιουργία αντικειμένων - Ενημέρωση αντικειμένων για Συνεργάτες Αναφερώνμενων
    for (let author of internalAuthorsRefs) {



      const networkReferenceFound = await NetworkReferences.findOne({
        where: {
          networkNetworkId: networkFound.network_id,
          userUserId: author.user_id,
        }
      });

      if (networkReferenceFound) {
        networkReferenceFound.frequency = author.frequency;
        networkReferenceFound.save()
      }
      else {

        await NetworkReferences.create({
          networkNetworkId: networkFound.network_id,
          userUserId: author.user_id,
          frequency: author.frequency
        })

      }

    }


    //Ταξινόμηση πίνακα με βάση την συχνότητα του αντικειμένου
    internalAuthorsRefs.sort((a, b) => b.frequency - a.frequency);
    //Παίρνουμε τα 5 πρώτα
    const topFiveRefAuthors = internalAuthorsRefs.slice(0, 3);

    //Δημιουργία αντικειμένων - Ενημέρωση αντικειμένων ια  Τοπ Συνεργάτες
    for (let author of topFiveRefAuthors) {

      const NetworkTopReferencesFound = await NetworkTopReferences.findOne({
        where: {
          networkNetworkId: networkFound.network_id,
          userUserId: author.user_id,
        }
      });

      if (NetworkTopReferencesFound) {
        NetworkTopReferencesFound.frequency = author.frequency;
        NetworkTopReferencesFound.save()
      }
      else {

        await NetworkTopReferences.create({
          networkNetworkId: networkFound.network_id,
          userUserId: author.user_id,
          frequency: author.frequency
        })

      }

    }







  }

}

exports.get_user_data_profile = async (req, res, next) => {


  //Αρχικά βρίσκουμε τον χρήστη απο την βάση
  const user = await User.findByPk(req.userData.userId, { include: [{ model: Profile }] });

  console.log("USER", user);

  await compute_profile_stats(req.userData.userId);
  await compute_profile_network(req.userData.userId);


  //Έπειτα αφού βρεθεί ο χρήστης έχουμε το ιδ του Προφίλ
  const profile = await Profile.findByPk(user.profile.profile_id, {
    include: [
      { model: Ability, as: 'profileabilities' },
      { model: Job, as: 'jobs' },
      { model: Organization, as: 'organizations' },
      { model: ResearchInterest, as: 'profileinterests' },
      { model: Studies, as: 'studies', },
      { model: ProfileStats },


    ]
  });




  if (user) {
    res.status(200).json({
      message: 'Profile Found',
      user: user,
      profile: profile
    })
  }


}


exports.add_profile_user_job = async (req, res, next) => {


  console.log(req.userData.userId);

  try {
    const user = await User.findByPk(req.userData.userId);

    console.log(user)

    if (user) {

      const profile = await Profile.findOne({ where: { userId: user.user_id } });

      if (profile) {
        const jobObj = {
          title: req.body.title,
          company: req.body.company,
          startYear: req.body.startYear,
          endYear: req.body.endYear
        }
        const jobCreated = await Job.create(jobObj);
        await jobCreated.setProfile(profile);

        res.status(200).json({
          message: 'Job added successfully',
          job: jobCreated
        })





      }

    }
  } catch (err) {
    console.log(err)
  }





}


exports.get_all_organizations = async (req, res, next) => {


  const user = await User.findByPk(req.userData.userId);


  if (user) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    const organizations = await profile.getOrganizations();

    console.log(organizations)

    if (organizations) {

      res.status(200).json({
        message: 'Organizations Found!',
        organizations: organizations
      })

    }


  }
}

exports.add_profile_user_organization = async (req, res, next) => {


  try {
    const user = await User.findByPk(req.userData.userId);


    if (user) {

      const profile = await Profile.findOne({ where: { userId: user.user_id } });

      const organizationObj = {
        name: req.body.name,
        description: req.body.description
      }


      const organizationCreated = await Organization.create(organizationObj);
      await organizationCreated.setProfile(profile);

      res.status(200).json({
        message: 'Organization added successfully',
        job: jobCreated
      })
    }
  } catch (err) {
    console.log(err)
  }


}

exports.add_profile_user_study = async (req, res, next) => {


  try {

    const user = await User.findByPk(req.userData.id);

    if (user) {
      const profile = await Profile.findOne({ where: { userId: user.user_id } });


      const studyObj = {
        title: req.body.title,
        school: req.body.school,
        endYear: req.body.endYear,
        school: req.body.school,

      }

      const studyCreated = await Studies.create(studyObj);
      await studyCreated.setProfile(profile);

      res.status(200).json({
        message: 'Study added successfully',
        study: studyCreated
      })

    }



  } catch (err) {
    console.log(err)
  }

}

exports.add_profile_user_ability = async (req, res, next) => {


  try {
    const user = await User.findByPk(req.userData.id);

    if (user) {
      const profile = await Profile.findOne({ where: { userId: user.user_id } });


      const ability = {
        keyword: req.body.keyword
      }

      const abilityCreated = await Ability.create(ability);
      await abilityCreated.setProfile(profile);

      res.status(200).json({
        message: 'Ability added successfully',
        ability: abilityCreated
      })

    }
  } catch (err) {
    console.log(err)
  }

}

exports.add_profile_user_interest = async (req, res, next) => {

  try {

    const user = await User.findByPk(req.userData.id);

    if (user) {
      const profile = await Profile.findOne({ where: { userId: user.user_id } });


      const interest = {
        keyword: req.body.keyword
      }

      const interestCreated = await ResearchInterest.create(interest);
      await interestCreated.setProfile(profile);

      res.status(200).json({
        message: 'Ability added successfully',
        interest: interestCreated
      })

    }


  } catch (err) {
    console.log(err)
  }

}


exports.update_profile_user_info = async (req, res, next) => {


  try {

    const user = await User.findByPk(req.userData.userId);



    console.log(user);


    if (user && user.user_id === req.userData.userId) {


      user.userName = req.body.userName;
      user.firstName = req.body.firstName;
      user.lastName = req.body.lastName;
      await user.save();

      res.status(200).json({
        message: 'User info updated successfully!',
        user: user
      })

    }

    else {
      res.status(400).json({
        message: 'Not authorized'
      })
    }

  } catch (err) {
    console.log(err)
  }


}


//Organizations functions
exports.add_new_organization = async (req, res, next) => {


  console.log()

  const organizationObj = {
    name: req.body.name,
    description: req.body.description,
  }

  const user = await User.findByPk(req.userData.userId);
  if (user && user.user_id === req.userData.userId) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    if (profile) {
      const organizationCreated = await Organization.create(organizationObj);

      if (organizationCreated) {
        await profile.addOrganization(organizationCreated);
        res.status(200).json({
          message: 'Organization added successfully',
          organization: organizationCreated
        })
      }

    }

  }




}

exports.update_organization = async (req, res, next) => {


  try {
    const id = req.params.id;

    const organizationFound = await Organization.findByPk(id);

    if (organizationFound) {

      organizationFound.name = req.body.name;
      organizationFound.description = req.body.description;
      organizationFound.save();

      res.status(200).json({
        message: 'Organization updated successfully',
        organization: organizationFound
      })


    }
  } catch (err) {
    console.log(err)
  }



}

exports.delete_organization = async (req, res, next) => {

  try {
    const id = req.params.id;

    const organizationFound = await Organization.findByPk(id);

    if (organizationFound) {
      organizationFound.destroy();

      res.status(200).json({
        message: 'Organization deleted',
        id: id
      })
    }

  } catch (err) {
    console.log(err)
  }



}



//Jobs functions

exports.get_all_jobs = async (req, res, next) => {

  const user = await User.findByPk(req.userData.userId);

  if (user) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    const jobs = await profile.getJobs();

    console.log(jobs)

    if (jobs) {

      res.status(200).json({
        message: 'Jobs Found!',
        jobs: jobs
      })

    }


  }

}

exports.add_new_job = async (req, res, next) => {

  try {

    const jobObj = {
      title: req.body.title,
      company: req.body.company,
      startYear: req.body.startYear,
      endYear: req.body.endYear
    }

    console.log(jobObj);

    const user = await User.findByPk(req.userData.userId);

    if (user && user.user_id === req.userData.userId) {

      const profile = await Profile.findOne({ where: { userId: user.user_id } });

      if (profile) {
        const jobCreated = await Job.create(jobObj);

        if (jobCreated) {
          await profile.addJob(jobCreated);
          res.status(200).json({
            message: 'Job added successfully',
            job: jobCreated
          })
        }


      }

    }

  } catch (err) {
    console.log(err)
  }

}

exports.update_job = async (req, res, next) => {



  try {
    const id = req.params.id;

    const jobFound = await Job.findByPk(id);

    if (jobFound) {

      jobFound.title = req.body.title;
      jobFound.company = req.body.company;
      jobFound.startYear = req.body.startYear;
      jobFound.endYear = req.body.endYear;
      jobFound.save();

      res.status(200).json({
        message: 'Job updated successfully',
        job: jobFound
      })


    }
  } catch (err) {
    console.log(err)
  }





}

exports.delete_job = async (req, res, next) => {


  try {
    const id = req.params.id;

    const jobFound = await Job.findByPk(id);

    if (jobFound) {
      jobFound.destroy();

      res.status(200).json({
        message: 'Job deleted',
        id: id
      })
    }

  } catch (err) {
    console.log(err)
  }



}

//Jobs functions

exports.get_all_studies = async (req, res, next) => {

  const user = await User.findByPk(req.userData.userId);

  if (user) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    const studies = await profile.getStudies();

    console.log(studies)

    if (studies) {

      res.status(200).json({
        message: 'Jobs Found!',
        studies: studies
      })

    }


  }

}

exports.add_new_study = async (req, res, next) => {

  try {

    const studyObj = {
      title: req.body.title,
      school: req.body.school,
      endYear: req.body.endYear
    }

    const user = await User.findByPk(req.userData.userId);

    if (user && user.user_id === req.userData.userId) {

      const profile = await Profile.findOne({ where: { userId: user.user_id } });

      if (profile) {
        const studyCreated = await Studies.create(studyObj);

        if (studyCreated) {
          await profile.addStudy(studyCreated);
          res.status(200).json({
            message: 'Study added successfully',
            study: studyCreated
          })
        }


      }

    }

  } catch (err) {
    console.log(err)
  }

}

exports.update_study = async (req, res, next) => {



  try {
    const id = req.params.id;

    const studyFound = await Studies.findByPk(id);

    if (studyFound) {

      studyFound.title = req.body.title;
      studyFound.school = req.body.school;
      studyFound.endYear = req.body.endYear;
      studyFound.save();

      res.status(200).json({
        message: 'Study updated successfully',
        study: studyFound
      })


    }
  } catch (err) {
    console.log(err)
  }





}

exports.delete_study = async (req, res, next) => {


  try {
    const id = req.params.id;

    const studyFound = await Studies.findByPk(id);

    if (studyFound) {
      studyFound.destroy();

      res.status(200).json({
        message: 'Study deleted',
        id: id
      })
    }

  } catch (err) {
    console.log(err)
  }



}


//abilities 

exports.get_all_abilities = async (req, res, next) => {

  const user = await User.findByPk(req.userData.userId);

  if (user) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    const profielAbilities = await profile.getProfileabilities();


    let abilities = []
    for (let profielAbility of profielAbilities) {


      console.log(profielAbility.ability_id)
      console.log("ID", profielAbility.ability_id)
      const ability = await Ability.findByPk(profielAbility.ability_id);

      abilities.push({
        ability_id: ability.ability_id,
        keyword: ability.keyword,
      })
    }


    console.log(abilities)

    if (abilities) {

      res.status(200).json({
        message: 'Abilities Found!',
        abilities: abilities
      })

    }


  }

}

exports.update_abilities = async (req, res, next) => {


  const abilities = req.body.abilities;

  console.log(req.body.abilities)

  const user = await User.findByPk(req.userData.userId);

  if (user && user.user_id === req.userData.userId) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    if (profile) {

      await profile.setProfileabilities(null);
      let profileAbilites = []
      for (let ability of abilities) {

        const abilityFound = await Ability.findOne({ where: { keyword: ability.keyword } });

        if (abilityFound) {
          profileAbilites.push(abilityFound)
        }

        else {
          const abilityCreated = await Ability.create({ keyword: ability.keyword });
          profileAbilites.push(abilityCreated)
        }

      }

      const abilitiesAdded = await profile.addProfileabilities(profileAbilites)

      const profielAbilities = await profile.getProfileabilities();


      res.status(200).json({
        message: 'Abilities updated',
        abilities: profielAbilities

      })

    }


  }



}




//interests 
exports.get_all_interests = async (req, res, next) => {

  const user = await User.findByPk(req.userData.userId);

  if (user) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    const profielInterests = await profile.getProfileinterests();


    let interests = []
    for (let profielInterest of profielInterests) {

      const interest = await ResearchInterest.findByPk(profielInterest.researchInterest_id);

      interests.push({
        researchInterest_id: interest.researchInterest_id,
        keyword: interest.keyword,
      })
    }


    console.log(interests)

    if (interests) {

      res.status(200).json({
        message: 'Interests Found!',
        interests: interests
      })

    }


  }

}


exports.update_interests = async (req, res, next) => {


  const interests = req.body.interests;


  const user = await User.findByPk(req.userData.userId);

  if (user && user.user_id === req.userData.userId) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    if (profile) {

      await profile.setProfileinterests(null);
      let profileInterests = []
      for (let interest of interests) {

        const interestsFound = await ResearchInterest.findOne({ where: { keyword: interest.keyword } });

        if (interestsFound) {
          profileInterests.push(interestsFound)
        }

        else {
          const interestCreated = await ResearchInterest.create({ keyword: interest.keyword });
          profileInterests.push(interestCreated)
        }

      }

      const interestsAdded = await profile.addProfileinterests(profileInterests)

      const interestsFound = await profile.getProfileinterests();
      res.status(200).json({
        message: 'Interests updated',
        interests: interestsFound

      })

    }


  }



}



exports.remove_photo_profile = async (req, res, next) => {


  const profileFound = await Profile.findOne({ where: { userId: req.userData.userId } });

  console.log(profileFound);

  if (profileFound) {

    const photoProfileFound = await PhotoProfile.findOne({ where: { photoProfileId: profileFound.profile_id } });

    if (photoProfileFound) {



      const targetDirectory = `./uploads/${req.userData.userId}/profilePhoto`;
      const oldFilePath = `${targetDirectory}/`;

      //Έλεγχος αν υπάρχει το παλιό path και διαγραφή όλων των παλιών αρχείων
      if (fs.existsSync(oldFilePath)) {
        const files = fs.readdirSync(oldFilePath);
        files.forEach((file) => {
          const filePath = path.join(oldFilePath, file);
          fs.unlinkSync(filePath);
        });

      } else {
        console.log('Directory does not exist:', targetDirectory);
      }

      await photoProfileFound.destroy();


      const newObjProfilePhoto = {
        filename: 'user.png',
        type: '.png',
        path: './uploads/defaultPhotoProfile/user.png'
      }



      const photoSaved = await PhotoProfile.create(newObjProfilePhoto);
      //Συσχέτιση profile με το αρχείο
      await profileFound.setPhotoProfile(photoSaved);

      if (photoSaved) {
        res.setHeader('Content-Type', `application/${newObjProfilePhoto.type}`);
        res.setHeader('Content-Disposition', `attachment; filename=${newObjProfilePhoto.filename}`);
        res.sendFile(path.resolve(newObjProfilePhoto.path));
      }


    }
  }
}

exports.upload_photo_profile = async (req, res, next) => {


  console.log(req.file);

  const userId = req.userData.userId;

  const photoProfile = req.file;
  const folderPath = './uploads/' + userId;
  const fileName = photoProfile.originalname;
  const filePath = folderPath + '/' + fileName;
  const file = photoProfile;
  const targetDirectory = `./uploads/${userId}/profilePhoto`;
  const targetPath = `${targetDirectory}/${file.originalname}`;



  //Δημιουργία αντικειμένου
  const fileObj = {
    filename: fileName,
    type: path.extname(filePath),
    path: targetPath,
  }

  console.log(fileObj)


  //Αποθήκευση αντικειμένου ContentFile

  const photoFound = await PhotoProfile.findOne({ where: { filename: fileObj.filename, type: fileObj.type, path: fileObj.path } })


  if (!photoFound) {
    const oldFilePath = `${targetDirectory}/`;

    //Έλεγχος αν υπάρχει το παλιό path και διαγραφή όλων των παλιών αρχείων
    if (fs.existsSync(oldFilePath)) {
      const files = fs.readdirSync(oldFilePath);
      files.forEach((file) => {
        const filePath = path.join(oldFilePath, file);
        fs.unlinkSync(filePath);
      });

    } else {
      console.log('Directory does not exist:', targetDirectory);
    }

    const profileFound = await Profile.findOne({ where: { userId: userId } });
    const oldPhoto = await PhotoProfile.findOne({ where: { photoProfileId: profileFound.profile_id } });


    console.log(oldFilePath);


    if (oldPhoto) {
      await oldPhoto.destroy();

    }


    const photoSaved = await PhotoProfile.create(fileObj);
    //Συσχέτιση profile με το αρχείο
    await profileFound.setPhotoProfile(photoSaved)

    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, { recursive: true });
    }

    fs.renameSync(file.path, targetPath);

    if (photoSaved) {
      res.setHeader('Content-Type', `application/${fileObj.type}`);
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.sendFile(path.resolve(targetPath));
    }

  }









}


exports.get_profile_photo = async (req, res, next) => {


  const id = req.userData.userId;


  const profileFound = await Profile.findOne({ where: { userId: id } });

  const photoProfile = await PhotoProfile.findOne({ where: { photoProfileId: profileFound.profile_id } })


  if (photoProfile) {
    const userId = req.userData.userId;
    const fileName = photoProfile.filename;
    const targetDirectory = `./uploads/${userId}/profilePhoto/`;
    const targetPath = `${targetDirectory}/${fileName}`;

    const type = path.extname(fileName);

    //Αν υπάρχει φωτογραφία προφίλ στον προσωπικο χώρου του χρήστη στέιλτει πίσω
    if (fs.existsSync(targetPath)) {

      res.setHeader('Content-Type', `application/${type}`);
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.sendFile(path.resolve(targetPath));
    }

    //αλλιώς στείλε την default
    else {
      const fileName = 'user.png';
      const targetDirectory = `./uploads/defaultPhotoProfile/`;
      const targetPath = `${targetDirectory}/${fileName}`;
      if (fs.existsSync(targetPath)) {

        res.setHeader('Content-Type', `application/${type}`);
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.sendFile(path.resolve(targetPath));
      }
    }
  }




}


exports.get_profile_stats = async (req, res, next) => {

  const user = await User.findByPk(req.userData.userId);

  if (user) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } },
      {
        include: {
          model: ProfileStats,
          // Here, you can specify any attributes from the ProfileStats model that you want to include
          attributes: ['citations', 'references', 'num_of_exported_presentation_file', 'num_of_exported_content_file'],
        },

      });

    console.log(profile)

    if (profile) {
      res.status(200).json({
        message: 'Profile Stats',
        profileStats: profile.ProfileStats
      })
    }


  }

}


exports.get_single_profile_stats = async (req, res, next) => {

  const user = await User.findByPk(req.params.userId);

  if (user) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    if (profile) {
      const profileStats = await profile.getProfileStats();
      res.status(200).json({
        message: 'Profile Stats',
        profileStats: profileStats
      })
    }


  }

}



exports.get_user_profile = async (req, res, next) => {

  console.log("UserData", req.params.id)

  try {



    const profileFound = await Profile.findOne({
      where: { userId: req.params.id },
      include: [
        { model: Ability, as: 'profileabilities' },
        { model: Job, as: 'jobs' },
        { model: Organization, as: 'organizations' },
        { model: ResearchInterest, as: 'profileinterests' },
        { model: Studies, as: 'studies' },
        { model: ProfileStats },
      ]
    });


    const userData = await User.findByPk(req.params.id);




    if (userData) {
      const user = {
        user_id: userData.user_id,
        userName: userData.userName,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      }



      if (profileFound) {
        await compute_profile_network(req.params.id);
        await compute_profile_stats(req.params.id);
        res.status(200).json({
          message: 'Profile Found',
          profile: profileFound,
          user: user

        })
      }
    }


  } catch (err) {
    console.log("EROR", err)

  }

}

exports.get_user_photo = async (req, res, next) => {


  const id = req.params.id;


  const profileFound = await Profile.findOne({ where: { userId: id } });

  if (profileFound) {
    const photoProfile = await PhotoProfile.findOne({ where: { photoProfileId: profileFound.profile_id } })

    if (profileFound && photoProfile) {
      const userId = id;
      const fileName = photoProfile.filename;
      const targetDirectory = `./uploads/${userId}/profilePhoto/`;
      const targetPath = `${targetDirectory}/${fileName}`;

      const type = path.extname(fileName);

      //Αν υπάρχει φωτογραφία προφίλ στον προσωπικο χώρου του χρήστη στέιλτει πίσω
      if (fs.existsSync(targetPath)) {

        res.setHeader('Content-Type', `application/${type}`);
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.sendFile(path.resolve(targetPath));
      }

      //αλλιώς στείλε την default
      else {
        const fileName = 'user.png';
        const targetDirectory = `./uploads/defaultPhotoProfile/`;
        const targetPath = `${targetDirectory}/${fileName}`;
        if (fs.existsSync(targetPath)) {

          res.setHeader('Content-Type', `application/${type}`);
          res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
          res.sendFile(path.resolve(targetPath));
        }
      }
    }
  }




}


exports.get_user_publications = async (req, res, next) => {

  const publications = await Publication.findAll({ where: { userId: req.params.id } });

  if (publications) {
    res.status(200).json({
      message: 'User s publications',
      publications: publications
    })
  }




}

exports.get_simple_live_users = async (req, res, next) => {

  const query = req.body.query;



  let resultFoUsersfirstNlastNameBased = await User.findAll({
    where: {
      [Op.or]: [
        {
          firstName: {
            [Op.like]: `${query.toLowerCase()}%`
          }
        },
        {
          lastName: {
            [Op.like]: `${query.toLowerCase()}%`
          }
        }
      ]
    }

  });



  let resultFoUsersUserNameBased = await User.findAll({
    where: {
      userName: {
        [Op.like]: `${query.toLowerCase()}%`
      }
    }
  });



  //interests
  let profiles = await Profile.findAll({
    include: [
      {
        model: ResearchInterest,
        as: 'profileinterests',
        where: {
          keyword: {
            [Op.like]: `${query.toLowerCase()}%`
          }, // Filter interests based on the given keywords
        },
      },
    ],
  });



  let users = [];

  for (let profile of profiles) {

    const userFound = await User.findByPk(profile.userId);

    const userToSet = {
      user_id: userFound.user_id,
      email: userFound.email,
      userName: userFound.userName,
      firstName: userFound.firstName,
      lastName: userFound.lastName,
      interests: profile.profileinterests
    }
    users.push(userToSet);

  }


  //studies

  let studies = await Studies.findAll({

    where: {
      title: {
        [Op.like]: `${query.toLowerCase()}%`
      }, // Filter interests based on the given keywords
    },


  });

  let usersFound = []
  for (let profile of studies) {

    const profileFound = await Profile.findByPk(profile.profileId, {
      include: [
        {
          model: Studies,
          as: 'studies',
        },
      ],
    });

    const user = await User.findByPk(profileFound.userId);

    const userToSet = {
      user_id: user.user_id,
      email: user.email,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      studies: profileFound.studies
    }

    usersFound.push(userToSet);

  }


  //organization based 
  let organizations = await Organization.findAll({

    where: {
      name: {
        [Op.like]: `${query.toLowerCase()}%`
      }, // Filter interests based on the given keywords
    },
  });

  let usersOrgFound = [];

  for (let profile of organizations) {

    const profileFound = await Profile.findByPk(profile.profileId, {
      include: [
        {
          model: Organization,
          as: 'organizations',
        },
      ],
    });

    const user = await User.findByPk(profileFound.userId);

    const userToSet = {
      user_id: user.user_id,
      email: user.email,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      organizations: profileFound.organizations
    }

    usersOrgFound.push(userToSet);

  }


  res.status(200).json({
    usersFirstNlastNameBased: resultFoUsersfirstNlastNameBased,
    usersUserNameBased: resultFoUsersUserNameBased,
    userResearchInterestBased: users,
    userStudiesBased: usersFound,
    userOrganizationBased: usersOrgFound

  })



}



exports.get_shopisticated_internal_users_result = async (req, res, next) => {


  const objectSearch = req.body;


  console.log(objectSearch);
  const firstName = objectSearch.firstName ? objectSearch.firstName : null;
  const lastName = objectSearch.lastName ? objectSearch.lastName : null;
  const userName = objectSearch.userName ? objectSearch.userName : null;
  const organization = objectSearch.organization ? objectSearch.organization : null;
  const interests = objectSearch.interests ? objectSearch.interests : null;
  const studies = objectSearch.studies ? objectSearch.studies : null;



  let whereCondition = {};

  let allUsers = [];
  if (firstName) {
    whereCondition.firstName = {
      [Op.like]: `${firstName.toLowerCase()}%`
    };
  }

  if (lastName) {
    whereCondition.lastName = {
      [Op.like]: `${lastName.toLowerCase()}%`
    };
  }

  if (userName) {
    whereCondition.userName = {
      [Op.like]: `${userName.toLowerCase()}%`
    };
  }


  let usersOrgFound = [];
  if (organization) {


    let organizationsFound = await Organization.findAll({
      where: {
        name: organization
      }
    });




    for (let profile of organizationsFound) {

      const profileFound = await Profile.findByPk(profile.profileId, {
        include: [
          {
            model: Organization,
            as: 'organizations',
          },
        ],
      });

      const user = await User.findByPk(profileFound.userId);

      const userToSet = {
        user_id: user.user_id,
        email: user.email,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
      }

      usersOrgFound.push(userToSet);
      allUsers.push(userToSet)

    }


  }


  if (interests) {
    let profiles = [];
    for (let interest of interests) {

      const profile = await Profile.findOne({
        include: [
          {
            model: ResearchInterest,
            as: 'profileinterests',
            where: {
              keyword: interest,
            },
          },
        ],
      });

      profiles.push(profile);



    }



    for (let profile of profiles) {



      console.log("Profile id : ", profile.userId)

      const userFound = await User.findByPk(profile.userId);

      console.log(userFound);

      const userToSet = {
        user_id: userFound.user_id,
        email: userFound.email,
        userName: userFound.userName,
        firstName: userFound.firstName,
        lastName: userFound.lastName,
        interests: profile.profileinterests
      }
      allUsers.push(userToSet);


    }





  }

  if (studies) {


    let profiles = [];
    for (let study of studies) {

      const profile = await Profile.findOne({
        include: [
          {
            model: Studies,
            as: 'studies',
            where: {
              title: study,
            },
          },
        ],
      });

      profiles.push(profile);



    }



    for (let profile of profiles) {


      const userFound = await User.findByPk(profile.userId);

      console.log(userFound);

      const userToSet = {
        user_id: userFound.user_id,
        email: userFound.email,
        userName: userFound.userName,
        firstName: userFound.firstName,
        lastName: userFound.lastName,
        studies: profile.studies
      }
      allUsers.push(userToSet);


    }

  }

  let usersShopisticatedResult;
  if (userName || firstName || lastName) {
    usersShopisticatedResult = await User.findAll({
      where: whereCondition
    });

    for (let user of usersShopisticatedResult) {
      const userToSet = {
        user_id: user.user_id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,


      }

      allUsers.push(userToSet)
    }
  }



  console.log("USER", usersShopisticatedResult);

  res.status(200).json({
    message: 'Users found',
    userFound: allUsers
  })


}



exports.get_network_user = async (req, res, next) => {



  try {



    const userId = req.params.userId;

    console.log("USER ID", userId)

    const user = await User.findByPk(userId);

    if (user) {

      const profile = await Profile.findOne({ where: { userId: user.user_id } });


      if (profile) {


        const networkCooperations = await Network.findOne({
          where: { profileId: profile.profile_id },
          include: [
            {
              model: User,
              as: 'users',
              attributes: ['user_id', 'firstName', 'lastName', 'email'],
              through: { model: NetworkCooperations },
            }
          ],
        });

        const networkTopCooperations = await Network.findOne({
          where: { profileId: profile.profile_id },
          include: [
            {
              model: User,
              as: 'users',
              attributes: ['user_id', 'firstName', 'lastName', 'email'],
              through: { model: NetworkTopCooperations },
            }
          ],
        });


        const networkReferences = await Network.findOne({
          where: { profileId: profile.profile_id },
          include: [
            {
              model: User,
              as: 'users',
              attributes: ['user_id', 'firstName', 'lastName', 'email'],
              through: { model: NetworkReferences },
            }
          ],
        });


        const networkTopReferences = await Network.findOne({
          where: { profileId: profile.profile_id },
          include: [
            {
              model: User,
              as: 'users',
              attributes: ['user_id', 'firstName', 'lastName', 'email'],
              through: { model: NetworkTopReferences },
            }
          ],
        });


        console.log("networkCooperations123", networkCooperations.users)


        res.status(200).json({
          message: 'Network found',
          networkCooperations: networkCooperations.users,
          networkTopCooperations: networkTopCooperations.users,
          networkReferences: networkReferences.users,
          networkTopReferences: networkTopReferences.users
        })



      }

    }




  } catch (err) {
    console.log(err)
  }





}


exports.follow_user = async (req, res, next) => {


  const currentUser = await User.findByPk(req.userData.userId);

  const userToFollow = await User.findByPk(req.params.userIdTofollow);

  console.log("CURRENT USER", currentUser);

  console.log("USER TO FOLLOW", userToFollow);



  if (!currentUser || !userToFollow) {
    return res.status(404).json({ message: 'User not found' });
  }



  const isAlreadyFollowing = await currentUser.hasFollowing(userToFollow);

  if (isAlreadyFollowing) {
    return res.status(400).json({ message: 'You are already following this user' });
  }

  // Establish the follow relationship
  await currentUser.addFollowing(userToFollow);


  const notificationForUser = await Notification.create({
    type: 'User Start Following',
    title: `${currentUser.firstName} ${currentUser.lastName} start following`,
    status: 'Unread',
    userToNotify: userToFollow.user_id,
    userCreator: currentUser.user_id
  })

  res.status(200).json({
    message: 'Followed successfully',
    user: {
      user_id: userToFollow.user_id,
      email: userToFollow.email,
      userName: userToFollow.userName,
      firstName: userToFollow.firstName,
      lastName: userToFollow.lastName,
    }
  });
}


exports.unfollow_user = async (req, res, next) => {

  const currentUser = await User.findByPk(req.userData.userId);

  const userToUnFollow = await User.findByPk(req.params.userIdToUnfollow);

  console.log("CURRENT USER", currentUser);

  console.log("USER TO FOLLOW", userToUnFollow);



  if (!currentUser || !userToUnFollow) {
    return res.status(404).json({ message: 'User not found' });
  }



  const isAlreadyFollowing = await currentUser.hasFollowing(userToUnFollow);

  if (isAlreadyFollowing) {


    await currentUser.removeFollowing(userToUnFollow);

    res.status(200).json({
      message: 'user unfollowed',
      userToUnFollow: userToUnFollow
    });

  }

}


exports.get_user_followers = async (req, res, next) => {


  const user = await User.findByPk(req.params.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const followers = await user.getFollowers({
    attributes: ['user_id', 'email', 'userName', 'firstName', 'lastName',]
  });



  res.status(200).json({
    followers: followers
  });



}



exports.get_user_followings = async (req, res, next) => {


  const user = await User.findByPk(req.params.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const following = await user.getFollowing({
    attributes: ['user_id', 'email', 'userName', 'firstName', 'lastName',]
  });


  res.status(200).json({
    following: following
  });



}





exports.endorse_user = async (req, res, next) => {


  const current_user = await User.findByPk(req.userData.userId);

  const user_to_endorse = await User.findByPk(req.params.userId);


  if (!current_user && !user_to_endorse) {
    return res.status(400).json({
      message: 'users not found'
    })
  }

  const newEndorsement = {
    evidence: req.body.evidence,
    endorsement: req.body.endorsement,
  }

  const endorsementCreated = await Endorse.create(newEndorsement);
  await current_user.addEndorsement(endorsementCreated);

  const endorsementCreatedFound = await Endorse.findByPk(endorsementCreated.endorse_id, {
    include: [
      {
        model: User,
        as: 'userCreator', // This should match the association alias 'userCreator'
        attributes: ['user_id', 'firstName', 'lastName', 'email', 'userName']
      }
    ]
  })


  //notify user 
  const notificationForUser = await Notification.create({
    type: 'User Endorse',
    title: `${current_user.firstName} ${current_user.lastName} made a new endorsement`,
    status: 'Unread',
    userToNotify: user_to_endorse.user_id,
    userCreator: current_user.user_id
  })

  const profileFound = await Profile.findOne({ where: { userId: user_to_endorse.user_id } });
  await endorsementCreated.setProfile(profileFound);

  res.status(200).json({
    endorsementCreated: endorsementCreatedFound
  })


}

exports.get_user_endorsements = async (req, res, next) => {


  const profile = await Profile.findOne({ where: { userId: req.params.userId } })

  if (!profile) {
    return res.status(400).json({
      message: 'Profile did not found'
    })
  }


  const endorsements = await Endorse.findAll({
    where: { profileId: profile.profile_id },
    include: [
      {
        model: User,
        as: 'userCreator', // This should match the association alias 'userCreator'
        attributes: ['user_id', 'firstName', 'lastName', 'email', 'userName']
      }
    ]
  });

  //εύρεση και τον ενδοκιμασιών που δημιουργεί



  const endorsementsCreated = await Endorse.findAll({
    where: { userId: req.params.userId },
    include: [
      {
        model: User,
        as: 'userCreator', // This should match the association alias 'userCreator'
        attributes: ['user_id', 'firstName', 'lastName', 'email', 'userName']
      }
    ]
  });

  res.status(200).json({
    endorsements: endorsements,
    endorsementsCreated: endorsementsCreated
  })

}


exports.delete_endorsement = async (req, res, next) => {

  const endorsementToDelete = await Endorse.findByPk(req.params.endorsementId);


  if (!endorsementToDelete) {
    return res.status(400).json({
      message: 'Endorsement did not found'
    })
  }

  endorsementToDelete.destroy().then(async num => {

    console.log(num)

    if (num) {

      res.status(201).json({
        message: "Endorsement Deleted!"
      })
    }

    else {
      res.status(201).json({
        message: "Endorsement was not found"
      })
    }


  })



}


exports.rate_single_user = async (req, res, next) => {



  try {
    const current_user = await User.findByPk(req.userData.userId);
    const userToRate = await User.findByPk(req.params.userId);

    if (!current_user || !userToRate) {
      return res.status(400).json({
        message: 'Users not found',
      });
    }

    console.log("req.body", req.body);

    const profileFound = await Profile.findOne({
      where: { userId: userToRate.user_id },
    });

    // Notify user
    const notificationForUser = await Notification.create({
      type: 'User Rate',
      title: `${current_user.firstName} ${current_user.lastName} made a rating ${req.body.rate}/5`,
      status: 'Unread',
      userToNotify: userToRate.user_id,
      userCreator: current_user.user_id,
    });

    // Find an existing rating if it exists
    let ratingFound = await Rating.findOne({
      where: { userCreatorId: current_user.user_id, profileId: profileFound.profile_id },
    });

    console.log("RATING FOUND", ratingFound)
    if (ratingFound) {
      // Update the existing rating
      ratingFound.rate = req.body.rate;
      await ratingFound.save();

      return res.status(200).json({
        message: 'Rating changed successfully',
        rating: ratingFound,
      });
    } else {
      // Create a new rating
      const rating = {
        rate: req.body.rate,
        userCreatorId: current_user.user_id,
        profileId: profileFound.profile_id,
      };

      const ratingCreated = await Rating.create(rating);

      res.status(200).json({
        message: 'Rating created successfully',
        rating: ratingCreated,
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }



}


exports.get_single_user_rating = async (req, res, next) => {



  const profileFound = await Profile.findOne({ where: { userId: req.params.userId } });


  if (!profileFound) {
    return res.status(400).json({
      message: 'Profile did not found'
    })
  }





  const ratings = await Rating.findAll({ where: { profileId: profileFound.profile_id } })







  let averageRating;
  let ratingNumbers = [];
  if (ratings) {



    for (let rating of ratings) {
      ratingNumbers.push(rating.rate);
    }

    if (ratingNumbers.length === 0) {
      averageRating = 0;
    }
    else {
      const sum = ratingNumbers.reduce((total, rating) => total + rating, 0);
      averageRating = sum / ratings.length;
    }

    console.log("averageRating", averageRating)

  }
  //

  const profileStatsFound = await ProfileStats.findOne({ where: { profileId: profileFound.profile_id } });
  profileStatsFound.rating = Math.round(averageRating);
  await profileStatsFound.save()

  res.status(200).json({
    rate: Math.round(averageRating)
  })



}



exports.get_current_user_and_profile_rating = async (req, res, next) => {




  const profileFound = await Profile.findOne({ where: { userId: req.params.userId } })


  if (!profileFound) {
    return res.status(400).json({
      message: 'Users not found'
    })
  }

  console.log('req.userData.userId', req.userData.userId);
  console.log('profileFound.profile_id', profileFound.profile_id);

  const ratingFound = await Rating.findOne({ where: { userCreatorId: req.userData.userId, profileId: profileFound.profile_id } })

  let number;
  if (ratingFound) {
    number = ratingFound.rate


  }


  res.status(200).json({
    message: 'Rating found',
    rate: number
  })





}


exports.get_live_userName = async (req, res, next) => {



  const query = req.body.query;

  let searches = await User.findOne({
    where: {
      userName: query
    },
    attributes: ['userName', 'firstName', 'lastName', 'email']
  });


  res.status(200).json({
    user: searches
  })



}


exports.get_live_emails = async (req, res, next) => {



  const query = req.body.query;

  let searches = await User.findOne({
    where: {
      email: query
    },
    attributes: ['userName', 'firstName', 'lastName', 'email']
  });


  res.status(200).json({
    user: searches
  })



}

exports.get_all_users = async (req, res, next) => {


  const allUsers = await User.findAll({});


  res.status(200).json({
    users: allUsers
  })



}


exports.delete_user = async (req, res, next) => {

  const userToDelete = await User.findByPk(req.params.userId);


  userToDelete.destroy().then(async num => {

    if (num) {

      res.status(201).json({
        message: "User Deleted!"
      })
    }

    else {
      res.status(201).json({
        message: "User was not found"
      })
    }


  })

}


exports.check_users_password = async (req, res, next) => {


  const currentUser = await User.findByPk(req.userData.userId);


  if (currentUser) {

    const result = await bcrypt.compare(req.body.query, currentUser.password);

    if (!result) {
      return res.status(200).json({
        message: 'Dif'
      })
    }

    res.status(200).json({
      message: 'Same'
    })

  }


}


exports.change_user_password = async (req, res, next) => {




  const userFound = await User.findByPk(req.userData.userId);


  if (!userFound) {
    return res.status(400).json({
      message: 'User not found'
    })
  }

  const oldPassword = req.body.oldPassword;

  const result = await bcrypt.compare(oldPassword, userFound.password);

  if (!result) {
    return res.status(400).json({
      message: 'Wrong password'
    })
  }

  const newPasswordHash = await bcrypt.hash(req.body.newPassword, 15)

  userFound.password = newPasswordHash;
  await userFound.save();

  res.status(200).json({
    message: 'New password change successfully'
  })




}


exports.change_user_email = async (req, res, next) => {




  const userFound = await User.findByPk(req.userData.userId);

  if (!userFound) {
    return res.status(400).json({
      message: 'User not found'
    })
  }

  // Δημιουργία αντικειμένου token που θα στείλουμε στον χρήστη για ενεργοποίηση του λογαριασμού του
  const token = jwt.sign({ data: 'Data token' }, 'ourSecretKey', { expiresIn: '10m' })
  userFound.userStatus = 'Inactive';
  userFound.email = req.body.email
  userFound.uniqueString = token;
  await userFound.save();


  // Δημιουργία αντικειμένου mailOptions που θα έχει τα στοιχεία που στέλνουμε το mail
  let mailOptions = {
    from: 'academicnetsp@gmail.com',
    to: req.body.email, // email χρήστη
    subject: 'Email Configuration',
    html: `<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="80%" cellpadding="0" cellspacing="0" style="background-color: #86CBFC;">
          <tr>
            <td align="center" style="padding: 3%;">
              <h1 style="color: white; line-height: 160%;">AcademicNet</h1>
              <h1 style="color: white;">Hello, ${userFound.firstName} ${userFound.lastName}</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="margin-top: 10%;">
              <h1 style="line-height: 150%; margin-bottom: 8%;">Please click the button below to verify your email address.</h1>
              <a href="https://localhost:4200/verify/${token}" style="text-decoration: none; color: inherit; width: 30%; display: block; height: 50px; line-height: 50px; text-align: center; background-color: white; font-weight: 600; font-size: 20px; border-radius: 15px;">Verify</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size: 20px;">
              <p>Thanks,</p>
              <p>Academic Net support</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
  };




  // send mail with defined transport object
  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {

    } else {
      console.log('Message sent: %s', info.messageId);

      return res.status(200).json({
        message: `A confirmation mail has sent to ${req.body.email}. Check your email!`
      })


    }
  });






}


exports.reset_user_password = async (req, res, next) => {


  const userFound = await User.findOne({ where: { email: req.body.email } });


  if (!userFound) {
    return res.status(400).json({
      message: 'User not found'
    })
  }

  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const specialChars = '!@#$&*';
  const numericChars = '0123456789';

  const passwordLength = 12; // You can adjust the length as needed
  let password = '';

  // Ensure the password meets the specified pattern
  while (!password.match(/^(?=.*[A-Z].*[A-Z])(?=.*[!@#$&*])(?=.*[0-9].*[0-9])(?=.*[a-z].*[a-z].*[a-z]).{8,}$/)) {
    password = '';
    for (let i = 0; i < passwordLength; i++) {
      const charSet = i % 4 === 0 ? uppercaseChars : i % 4 === 1 ? lowercaseChars : i % 4 === 2 ? specialChars : numericChars;
      const randomIndex = Math.floor(Math.random() * charSet.length);
      password += charSet[randomIndex];
    }
  }



  const hash = await bcrypt.hash(password, 15);
  userFound.password = hash;
  userFound.save();



  // Δημιουργία αντικειμένου mailOptions που θα έχει τα στοιχεία που στέλνουμε το mail
  let mailOptions = {
    from: 'academicnetsp@gmail.com',
    to: userFound.email, // email χρήστη
    subject: 'Reset Password',
    html: `<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="80%" cellpadding="0" cellspacing="0" style="background-color: #86CBFC;">
          <tr>
            <td align="center" style="padding: 3%;">
              <h1 style="color: white; line-height: 160%;">AcademicNet</h1>
              <h1 style="color: white;">Hello, ${userFound.firstName} ${userFound.lastName}</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="margin-top: 10%;">
              <h1 style="line-height: 150%; margin-bottom: 2%;">New Password:</h1>
              <div style="border:2px solid black; background-color:white;" width:50%;" ><h1>${password}</h1</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size: 20px;">
              <p>Thanks,</p>
              <p>Academic Net support</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
  };


  //Αποστολή email
  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
    } else {
      console.log('Message sent: %s', info.messageId);

      res.status(200).json({
        message: "New Password sent to " + userFound.email + '. Please check your email!'
      })

    }
  });







}


exports.resend_token = async (req, res, next) => {

  const userFound = await User.findOne({ where: { email: req.body.email } });


  if (!userFound) {
    return res.status(400).json({
      message: 'User not found'
    })
  }


  // Δημιουργία αντικειμένου token που θα στείλουμε στον χρήστη για ενεργοποίηση του λογαριασμού του
  const token = jwt.sign({ data: 'Data token' }, 'ourSecretKey', { expiresIn: '10m' });

  userFound.uniqueString = token;
  await userFound.save();


  // Δημιουργία αντικειμένου mailOptions που θα έχει τα στοιχεία που στέλνουμε το mail
  let mailOptions = {
    from: 'academicnetsp@gmail.com',
    to: userFound.email, // email χρήστη
    subject: 'Email Configuration',
    html: `<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center">
      <table width="80%" cellpadding="0" cellspacing="0" style="background-color: #86CBFC;">
        <tr>
          <td align="center" style="padding: 3%;">
            <h1 style="color: white; line-height: 160%;">AcademicNet</h1>
            <h1 style="color: white;">Hello, ${userFound.firstName} ${userFound.lastName}</h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="margin-top: 10%;">
            <h1 style="line-height: 150%; margin-bottom: 8%;">Please click the button below to verify your email address.</h1>
            <a href="http://localhost:4200/verify/${token}" style="text-decoration: none; color: inherit; width: 30%; display: block; height: 50px; line-height: 50px; text-align: center; background-color: white; font-weight: 600; font-size: 20px; border-radius: 15px;">Verify</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="font-size: 20px;">
            <p>Thanks,</p>
            <p>Academic Net support</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
  };



  // send mail with defined transport object
  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
    } else {
      console.log('Message sent: %s', info.messageId);

      res.status(200).json({
        message: `A confirmation mail has sent to ${userFound.email}. Check your email!`,
      })


    }
  });



}


exports.verify_single_user = async (req, res, next) => {

  const userToVerify = await User.findByPk(req.params.id);


  if (!userToVerify) {
    return res.status(400).json({
      message: 'User not found'
    })
  }


  userToVerify.userStatus = 'Active';
  userToVerify.loginAttemps = 0;
  await userToVerify.save();

  res.status(200).json({
    message: 'User verified successfully!'
  })



}

exports.inactivate_single_user = async (req, res, next) => {

  const userToInactivate = await User.findByPk(req.params.id);


  if (!userToInactivate) {
    return res.status(400).json({
      message: 'User not found'
    })

  }

  userToInactivate.userStatus = 'Inactive';
  userToInactivate.loginAttemps = 3;
  await userToInactivate.save();

  res.status(200).json({
    message: 'User inactivated successfully!'
  })


}



exports.change_user_info = async (req, res, next) => {

  const userToChange = await User.findByPk(req.params.id);

  if (!userToChange) {
    return res.status(400).json({
      message: 'User not found'
    })
  }


  userToChange.firstName = req.body.firstName;
  userToChange.lastName = req.body.lastName;
  userToChange.userName = req.body.userName;


  await userToChange.save();

  res.status(200).json({
    message: 'User updated successfully'
  })

}





exports.add_admin_organization = async (req, res, next) => {



  try {
    const user = await User.findByPk(req.params.id);


    if (user) {

      const profile = await Profile.findOne({ where: { userId: user.user_id } });

      const organizationObj = {
        name: req.body.name,
        description: req.body.description
      }


      const organizationCreated = await Organization.create(organizationObj);
      await organizationCreated.setProfile(profile);

      res.status(200).json({
        message: 'Organization added successfully',
        organization: organizationCreated
      })
    }
  } catch (err) {
    console.log(err)
  }


}



exports.delete_user_organization = async (req, res, next) => {



  try {

    const organizationFound = await Organization.findByPk(req.params.id);

    if (organizationFound) {
      organizationFound.destroy();

      res.status(200).json({
        message: 'Organization deleted'
      })
    }

  } catch (err) {
    console.log(err)
  }


}



exports.update_user_organization = async (req, res, next) => {


  try {
    const id = req.params.id;

    const organizationFound = await Organization.findByPk(id);

    if (organizationFound) {

      organizationFound.name = req.body.name;
      organizationFound.description = req.body.description;
      organizationFound.save();

      res.status(200).json({
        message: 'Organization updated successfully',
        organization: organizationFound
      })


    }
  } catch (err) {
    console.log(err)
  }

}



exports.add_new_admin_job = async (req, res, next) => {


  try {

    const jobObj = {
      title: req.body.title,
      company: req.body.company,
      startYear: req.body.startYear,
      endYear: req.body.endYear
    }

    console.log(jobObj);

    const user = await User.findByPk(req.params.id);

    if (user) {

      const profile = await Profile.findOne({ where: { userId: user.user_id } });

      if (profile) {
        const jobCreated = await Job.create(jobObj);

        if (jobCreated) {
          await profile.addJob(jobCreated);
          res.status(200).json({
            message: 'Job added successfully',
            job: jobCreated
          })
        }


      }

    }

  } catch (err) {
    console.log(err)
  }


}

exports.delete_user_admin_job = async (req, res, next) => {


  try {
    const id = req.params.id;

    const studyFound = await Studies.findByPk(id);

    if (studyFound) {
      studyFound.destroy();

      res.status(200).json({
        message: 'Study deleted',
        id: id
      })
    }

  } catch (err) {
    console.log(err)
  }


}


exports.update_user_admin_job = async (req, res, next) => {

  try {
    const id = req.params.id;

    const jobFound = await Job.findByPk(id);

    if (jobFound) {

      jobFound.title = req.body.title;
      jobFound.company = req.body.company;
      jobFound.startYear = req.body.startYear;
      jobFound.endYear = req.body.endYear;
      jobFound.save();

      res.status(200).json({
        message: 'Job updated successfully',
        job: jobFound
      })


    }
  } catch (err) {
    console.log(err)
  }
}


exports.add_new_admin_study = async (req, res, next) => {

  try {

    const studyObj = {
      title: req.body.title,
      school: req.body.school,
      endYear: req.body.endYear
    }

    const user = await User.findByPk(req.params.id);

    if (user) {

      const profile = await Profile.findOne({ where: { userId: user.user_id } });

      if (profile) {
        const studyCreated = await Studies.create(studyObj);

        if (studyCreated) {
          await profile.addStudy(studyCreated);
          res.status(200).json({
            message: 'Study added successfully',
            study: studyCreated
          })
        }


      }

    }

  } catch (err) {
    console.log(err)
  }

}



exports.add_new_admin_abilities = async (req, res, next) => {


  const abilities = req.body.abilities;


  console.log

  const user = await User.findByPk(req.params.id);

  if (user) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    if (profile) {

      await profile.setProfileabilities(null);
      let profileAbilites = []
      for (let ability of abilities) {

        const abilityFound = await Ability.findOne({ where: { keyword: ability.keyword } });

        if (abilityFound) {
          profileAbilites.push(abilityFound)
        }

        else {
          const abilityCreated = await Ability.create({ keyword: ability.keyword });
          profileAbilites.push(abilityCreated)
        }

      }

      const abilitiesAdded = await profile.addProfileabilities(profileAbilites)

      const profielAbilities = await profile.getProfileabilities();


      res.status(200).json({
        message: 'Abilities updated',
        abilities: profielAbilities

      })

    }


  }


}


exports.add_new_admin_interests = async (req, res, next) => {


  const interests = req.body.interests;


  const user = await User.findByPk(req.params.id);

  if (user) {

    const profile = await Profile.findOne({ where: { userId: user.user_id } });

    if (profile) {

      await profile.setProfileinterests(null);
      let profileInterests = []
      for (let interest of interests) {

        const interestsFound = await ResearchInterest.findOne({ where: { keyword: interest.keyword } });

        if (interestsFound) {
          profileInterests.push(interestsFound)
        }

        else {
          const interestCreated = await ResearchInterest.create({ keyword: interest.keyword });
          profileInterests.push(interestCreated)
        }

      }

      const interestsAdded = await profile.addProfileinterests(profileInterests)

      const interestsFound = await profile.getProfileinterests();
      res.status(200).json({
        message: 'Interests updated',
        interests: interestsFound

      })

    }


  }

}


exports.change_admin_user_email = async (req, res, next) => {


  const userFound = await User.findByPk(req.params.id);

  if (!userFound) {
    return res.status(400).json({
      message: 'User not found'
    })
  }

  // Δημιουργία αντικειμένου token που θα στείλουμε στον χρήστη για ενεργοποίηση του λογαριασμού του
  const token = jwt.sign({ data: 'Data token' }, 'ourSecretKey', { expiresIn: '10m' })
  userFound.userStatus = 'Inactive';
  userFound.email = req.body.email
  userFound.uniqueString = token;
  await userFound.save();


  // Δημιουργία αντικειμένου mailOptions που θα έχει τα στοιχεία που στέλνουμε το mail
  let mailOptions = {
    from: 'academicnetsp@gmail.com',
    to: req.body.email, // email χρήστη
    subject: 'Email Configuration',
    html: `<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="80%" cellpadding="0" cellspacing="0" style="background-color: #86CBFC;">
          <tr>
            <td align="center" style="padding: 3%;">
              <h1 style="color: white; line-height: 160%;">AcademicNet</h1>
              <h1 style="color: white;">Hello, ${userFound.firstName} ${userFound.lastName}</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="margin-top: 10%;">
              <h1 style="line-height: 150%; margin-bottom: 8%;">Please click the button below to verify your email address.</h1>
              <a href="http://localhost:4200/verify/${token}" style="text-decoration: none; color: inherit; width: 30%; display: block; height: 50px; line-height: 50px; text-align: center; background-color: white; font-weight: 600; font-size: 20px; border-radius: 15px;">Verify</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size: 20px;">
              <p>Thanks,</p>
              <p>Academic Net support</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
  };




  // send mail with defined transport object
  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {

    } else {
      console.log('Message sent: %s', info.messageId);

      return res.status(200).json({
        message: `A confirmation mail has sent to ${req.body.email}. Check your email!`
      })


    }
  });


}


exports.get_all_requests = async (req, res, next) => {


  const allRequests = await RequestFile.findAll({
    include: [
      {
        model: ContentFile,
        as: 'contentFile',
      },
      {
        model: PresentantionFile,
        as: 'presentantionFile',
      },
      {
        model: User,
        as: 'user',
      },
    ],
  });;

  res.status(200).json({
    requests: allRequests
  })


}

exports.get_all_notifications = async (req, res, next) => {

  const notifications = await Notification.findAll({
    include: [
      {
        model: User,
        as: 'creator',
      },
      {
        model: User,
        as: 'user',
      },
    ],
  });

  res.status(200).json({
    notifications: notifications
  })
}



exports.get_publications_from_followings = async (req, res, next) => {

  const current_user = await User.findByPk(req.userData.userId);

  const followings = await current_user.getFollowing({
    attributes: ['user_id', 'userName', 'email'],
  });

  let publications = []
  for (let following of followings) {



    const publication = await Publication.findAll({
      where: { userId: following.user_id }, include: [{
        model: User,
        as: 'user', // Use the alias specified in the Publication model
        attributes: ['user_id', 'firstName', 'lastName', 'email', 'userName'], // Include only the desired user attributes
      }]
    })
    publications.push(publication)

  }

  console.log(publications);

  res.status(200).json({
    message: 'Publications from followings',
    publications: publications
  })


}


