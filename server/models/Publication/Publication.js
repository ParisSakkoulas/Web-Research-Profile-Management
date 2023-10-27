
const ExternalReference = require("../ExternalReference");
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const { DataTypes } = Sequelize;

const Tag = require("../Tag");
const Article = require("./Article");
const Book = require("./Book");
const Proceeding = require("./Proceedings");
const Thesis = require("./Thesis");
const ChapterBk = require("./BookChapter");
const TechReport = require("./TechnicalReport");
const PublicationTags = require("../Publication/PublicationTags");
const Category = require("./Category");
const User = require("../User");
const Other = require("./Other");
const PublicationStats = require("./PublicationStats");
const InternalReference = require("./InternalReference");
const ContentFile = require("../Files/ContentFile");
const PresentantionFile = require("../Files/PresentantionFile");
const ExternalAuthor = require("../ExternalAuthor");

const Publication = db.define('publication', {

  publication_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  title:
  {
    type: DataTypes.STRING(500),
    allowNull: false
  },

  section:
  {
    type: DataTypes.ENUM("Article", "Book", "Proceedings", "Thesis", "Book_Chapter", "Tech_Report", "Other"),
    allowNull: false,
  },

  abstract:
  {
    type: DataTypes.TEXT('medium')
  },

  isbn:
  {
    type: DataTypes.STRING,
    validate: {
      is: /^\d{10}$|^\d{13}$/
    }
  },

  doi:
  {
    type: DataTypes.STRING,
    validate: {
      is: /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/
    }
  },

  year:
  {
    type: DataTypes.STRING,
    validate: {
      is: /(?:(?:18|19|20|21)[0-9]{2})/
    }
  },

  accessibility:
  {
    type: DataTypes.ENUM("Public", "Private"),
    defaultValue: 'Public',
  },

  notes:
  {
    type: DataTypes.TEXT
  }


});



//Συσχέτιση των δύο πινάκων Publication και Tag, Ν - Μ συσχέτιση.
Publication.belongsToMany(Tag, { through: PublicationTags });
Tag.belongsToMany(Publication, { through: PublicationTags });



//Δημιουργία αυτοσυσχέτισης για μια Δημοσίευση με μια άλλη Εσωτερική Δημοσίευση
Publication.belongsToMany(Publication, { through: InternalReference, as: 'references' });





//Δημιουργία του πίνακα που θα περιέχει το ιδ μιας δημοσίευσης και το ιδ της εξωτερικής δημοσίευσης στην οποία θα αναφέρεται η πρώτη
const ExternalReferences = db.define('ExternalReferences', {}, { timestamps: false });
//Συσχέτιση των δύο πινάκων Publication και ExternalReference, Ν-Μ συσχέτιση.
Publication.belongsToMany(ExternalReference, { through: ExternalReferences, as: 'exreferences' })
ExternalReference.belongsToMany(Publication, { through: ExternalReferences, as: 'exreferences' })

//Δημιουργία του πίνακα που θα περιέχει το ιδ μιας δημοσίευσης και το ιδ της εξωτερικής δημοσίευσης στην οποία θα αναφέρεται η πρώτη
const PublicationCategories = db.define('PublicationCategories', {}, { timestamps: false });
//Συσχέτιση των δύο πινάκων Publication και ExternalReference, Ν-Μ συσχέτιση.
Publication.belongsToMany(Category, { through: PublicationCategories, as: 'publicationcategories' })
Category.belongsToMany(Publication, { through: PublicationCategories, as: 'publicationcategories' })


//Συσχέτιση δημοσίευσης με τον Χρήστη
// Ένας χρήστης μπορεί να κατέχει πολλές δημοσιεύσεις ενώ μια δημοσίευση μπορεί να  ανήκει σε έναν μόνο Χρήστη. Σχέση 1 - Ν
User.hasMany(Publication, { as: 'publications', onDelete: 'CASCADE', foreignKey: 'userId' });
Publication.belongsTo(User, { as: 'user', onDelete: 'CASCADE', foreignKey: 'userId' })

//Συσχέτιση Δημοσίευσης με τν χρήστη ως συγγραφές
// Ένας χρήστης μπορεί να είναι συγγραφέας σε πολλές δημοσιεύσεις και πολλές δημοσιεύσεις μπορούν να έχουμε πολλύς χρήστες ως συγγραφείς
User.belongsToMany(Publication, { through: 'publicationinternalauthors', as: 'internalAuthoredPublications', foreignKey: 'userId' });
Publication.belongsToMany(User, { through: 'publicationinternalauthors', as: 'internalAuthors', foreignKey: 'publicationId' });

//Συσχέτιση Δημοσίευσης με τν χρήστη ως συγγραφές
// Ένας εξωτερικός συγγραφέας μπορεί να είναι συγγραφέας σε πολλές δημοσιεύσεις και πολλές δημοσιεύσεις μπορούν να έχουμε πολλούς εξωτερικούς συγγραφείς ως συγγραφείς
ExternalAuthor.belongsToMany(Publication, { through: 'publicationexternalauthors', as: 'externalAuthoredPublications', foreignKey: 'extrnalId' });
Publication.belongsToMany(ExternalAuthor, { through: 'publicationexternalauthors', as: 'externalAuthors', foreignKey: 'publicationId' });


//Συσχέτιση των δύο πινάκων Publication και PublicationStats, 1-M συσχέτιση.
Publication.hasOne(PublicationStats, { onDelete: 'CASCADE', foreignKey: 'publicationId' });
PublicationStats.belongsTo(Publication, { onDelete: 'CASCADE', foreignKey: 'publicationId' });


//Συσχέτιση δημοσίευσης με τον Αρχείο Άρθρου ή Αρχείο Περιεχομένου
//Μια δημοσίευση μπορεί να έχει πολλά αρχεία ενώ ένα αρχείο αφορά μια συγκεκριμένη δημοσίευση
Publication.hasMany(ContentFile, { as: 'contentFile', onDelete: 'CASCADE', foreignKey: 'publicationId' });
ContentFile.belongsTo(Publication, { as: 'publication', onDelete: 'CASCADE', foreignKey: 'publicationId' })

//Συσχέτιση δημοσίευσης με τον Αρχείο Άρθρου ή Αρχείο Περιεχομένου
//Μια δημοσίευση μπορεί να έχει πολλά αρχεία ενώ ένα αρχείο αφορά μια συγκεκριμένη δημοσίευση
Publication.hasMany(PresentantionFile, { as: 'presentantionFile', onDelete: 'CASCADE', foreignKey: 'publicationId' });
PresentantionFile.belongsTo(Publication, { as: 'publication', onDelete: 'CASCADE', foreignKey: 'publicationId' })



//Συσχέτιση των δύο πινάκων Publication και Article, 1-1 συσχέτιση.
Publication.hasOne(Article, { onDelete: 'CASCADE', foreignKey: 'publicationId' });
Article.belongsTo(Publication, { onDelete: 'CASCADE', foreignKey: 'publicationId' });

//Συσχέτιση των δύο πινάκων Publication και Book, 1-1 συσχέτιση.
Publication.hasOne(Book, { onDelete: 'CASCADE', foreignKey: 'publicationId' });
Book.belongsTo(Publication, { onDelete: 'CASCADE', foreignKey: 'publicationId' });

//Συσχέτιση των δύο πινάκων Publication και Proceeding, 1-1 συσχέτιση.
Publication.hasOne(Proceeding, { onDelete: 'CASCADE', foreignKey: 'publicationId' });
Proceeding.belongsTo(Publication, { onDelete: 'CASCADE', foreignKey: 'publicationId' });

//Συσχέτιση των δύο πινάκων Publication και Thesis, 1-1 συσχέτιση.
Publication.hasOne(Thesis, { onDelete: 'CASCADE', foreignKey: 'publicationId' });
Thesis.belongsTo(Publication, { onDelete: 'CASCADE', foreignKey: 'publicationId' });

//Συσχέτιση των δύο πινάκων Publication και ChapterBk, 1-1 συσχέτιση.
Publication.hasOne(ChapterBk, { onDelete: 'CASCADE', foreignKey: 'publicationId' });
ChapterBk.belongsTo(Publication, { onDelete: 'CASCADE', foreignKey: 'publicationId' });

//Συσχέτιση των δύο πινάκων Publication και TechReport, 1-1 συσχέτιση.
Publication.hasOne(TechReport, { onDelete: 'CASCADE', foreignKey: 'publicationId' });
TechReport.belongsTo(Publication, { onDelete: 'CASCADE', foreignKey: 'publicationId' });

//Συσχέτιση των δύο πινάκων Publication και Other, 1-1 συσχέτιση.
Publication.hasOne(Other, { onDelete: 'CASCADE', foreignKey: 'publicationId' });
Other.belongsTo(Publication, { onDelete: 'CASCADE', foreignKey: 'publicationId' });

module.exports = Publication;
