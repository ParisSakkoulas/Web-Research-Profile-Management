const Tag = require("../models/Tag")


exports.get_all_tags = (req, res, next) => {

  Tag.findAll().then(tagsFound => {

    res.status(200).json({
      message: "Tags Found",
      tags: tagsFound,

    })

  }).catch(err => {

    res.status(500).json({
      message: "Error while fectching the tags",
      error: err.message
    })

  })



}
