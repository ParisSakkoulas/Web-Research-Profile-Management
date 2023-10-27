const RequestFile = require("../models/Files/RequestFile");
const Notification = require("../models/Notification");
const Category = require("../models/Publication/Category");
const Publication = require("../models/Publication/Publication");
const User = require("../models/User");




exports.add_new_notification = async (req, res, next) => {


    const notificationToAdd = req.body;


    console.log("NOTIFICATIONS", req.body)

    const notificationCreated = await Notification.create({
        type: req.body.type,
        title: req.body.title,
        status: req.body.status,
        content: req.body.content,
    });

    //set user to notify
    const userToNotify = await User.findByPk(notificationToAdd.userToNotify)
    await notificationCreated.setUser(userToNotify);


    //set user creator
    const userCreator = await User.findByPk(req.userData.userId);
    await userCreator.addCreatedNotification(notificationCreated);



    if (req.body.type === 'Request File') {

        const requestFound = await RequestFile.findByPk(req.body.request_id);

        if (requestFound) {
            notificationCreated.setRequestFile(requestFound);
        }
    }


    res.status(200).json({
        message: 'User Notified',
        notificationCreated: notificationCreated
    })
}

exports.get_all_notifications = async (req, res, next) => {




    const notifications = await Notification.findAll({
        include: {
            model: RequestFile,
            association: 'requestFile'
        },
    });

    console.log("Notifications", notifications)


    res.status(200).json({
        message: 'Notification user',
        notifications: notifications
    })





}


exports.get_single_notification = async (req, res, next) => {


    const notification = await Notification.findByPk(req.params.notificationId, {
        include: [{
            model: RequestFile,
            association: 'requestFile'
        },

        {
            model: User,
            as: 'user',
            attributes: ['user_id', 'firstName', 'lastName', 'username', 'email']
        },

        {
            model: User,
            as: 'creator',
            attributes: ['user_id', 'firstName', 'lastName', 'username', 'email']
        }


        ]


    });

    if (notification) {
        res.status(200).json({
            message: 'Notification found',
            notification: notification,
        });
    }
}


exports.set_notification_as_read = async (req, res, next) => {


    console.log(req.params);

    const notificationFound = await Notification.findByPk(req.params.notificationId);


    console.log("NOTIFICATION FOUND", notificationFound);

    if (notificationFound) {
        notificationFound.status = 'Read';
        await notificationFound.save();

        res.status(200).json({
            message: 'Notification status changed to read'
        })
    }


}


exports.delete_notification = async (req, res, next) => {

    const deleteNotification = await Notification.findByPk(req.params.notificationId);

    Notification

    if (deleteNotification) {


        deleteNotification.destroy().then(async num => {

            console.log(num)

            if (num) {

                res.status(201).json({
                    message: "Notification Deleted!"
                })
            }

            else {
                res.status(201).json({
                    message: "Notification was not found"
                })
            }


        })




    }
}