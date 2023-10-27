
const Sequelize = require("sequelize");
const db = require("../../config/db.config");
const Ability = require("./Ability");
const Job = require("./Jobs");
const ResearchInterest = require("./ResearchInterest");
const Studies = require("./Studies");
const Organization = require("./Organization");
const ProfileView = require("./ProfileView");
const { DataTypes } = Sequelize;

const Profile = db.define('profile', {

  profile_id:
  {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },




},
  { timestamps: false }
);

//Συσχέτιση δημοσίευσης με τον Χρήστη
// Ένα προφιλ συσχετίζεται με πολλά Studies ενώ κάθε Study αφορά ένα συγκεκριμένο Profile
Profile.hasMany(Studies, { as: 'studies', onDelete: 'CASCADE', foreignKey: 'profileId' });
Studies.belongsTo(Profile, { as: 'profile', onDelete: 'CASCADE', foreignKey: 'profileId' });


//Συσχέτιση δημοσίευσης με τον Χρήστη
// Ένα προφιλ συσχετίζεται με πολλά Job ενώ κάθε Job αφορά ένα συγκεκριμένο Profile
Profile.hasMany(Job, { as: 'jobs', onDelete: 'CASCADE', foreignKey: 'profileId' });
Job.belongsTo(Profile, { as: 'profile', onDelete: 'CASCADE', foreignKey: 'profileId' });


//Συσχέτιση δημοσίευσης με τον Χρήστη
// Ένα προφιλ συσχετίζεται με πολλά Job ενώ κάθε Job αφορά ένα συγκεκριμένο Profile
Profile.hasMany(Organization, { as: 'organizations', onDelete: 'CASCADE', foreignKey: 'profileId' });
Organization.belongsTo(Profile, { as: 'profile', onDelete: 'CASCADE', foreignKey: 'profileId' });


//Συσχέτιση Profile με ProfileView
// Ένα προφιλ συσχετίζεται με πολλά ProfileViews ενώ κάθε ProfileView αφορά ένα συγκεκριμένο Profile
Profile.hasMany(ProfileView, { as: 'views', onDelete: 'CASCADE', foreignKey: 'viewerId' });
ProfileView.belongsTo(Profile, { as: 'viewer', onDelete: 'CASCADE', foreignKey: 'viewerId' });

ProfileView.belongsTo(Profile, { as: 'owner', onDelete: 'CASCADE', foreignKey: 'ownerId' });
Profile.belongsTo(ProfileView, { as: 'owner', onDelete: 'CASCADE', foreignKey: 'ownerId' });




//Συσχέτιση δημοσίευσης με τον Χρήστη
// Ένα προφιλ συσχετίζεται με πολλές Ικανότητες ενώ κάθε Ικανότητα θα μπορεί να συσχετίζεται με πολλά προφίλ
const ProfileAbilities = db.define('ProfileAbilities', {}, { timestamps: false });
Profile.belongsToMany(Ability, { through: ProfileAbilities, as: 'profileabilities' });
Ability.belongsToMany(Profile, { through: ProfileAbilities, as: 'profileabilities' });


//Συσχέτιση δημοσίευσης με τον Χρήστη
// Ένα προφιλ συσχετίζεται με πολλα Ενδιαφέροντα ενώ κάθε Ενδιαφέρον αφορά ένα και μόνο Προφίλ
const ProfileInterests = db.define('ProfileInterests', {}, { timestamps: false });
Profile.belongsToMany(ResearchInterest, { through: ProfileInterests, as: 'profileinterests' });
ResearchInterest.belongsToMany(Profile, { through: ProfileInterests, as: 'profileinterests' });

module.exports = Profile;
