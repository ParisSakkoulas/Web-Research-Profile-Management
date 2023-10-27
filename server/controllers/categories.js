const Category = require("../models/Publication/Category");
const Publication = require("../models/Publication/Publication");
const User = require("../models/User");



exports.add_new_category = async (req, res, next) => {


    const category = {
        name: req.body.name,
        description: req.body.description
    }



    try {



        const existingCategory = await Category.findOne({ where: { name: category.name } })




        if (!existingCategory) {

            const categoryCreated = await Category.create(category);


            const userCreator = await User.findOne({ where: { user_id: req.userData.userId } });

            await categoryCreated.setUser(userCreator);

            if (category) {
                res.status(200).json({
                    message: 'Category Created successfully',
                    category: categoryCreated
                })
            }

            else {
                res.status(400).json({
                    message: 'Something went wrong'
                })
            }

        }

        else {
            res.status(400).json({
                message: 'Category already exists'
            })
        }



    } catch (err) {
        console.log(err)
    }






}


exports.get_all_my_categories = async (req, res, next) => {

    const currentUser = await User.findOne({ where: { user_id: req.userData.userId } });


    Category.findAll({
        where: { userId: currentUser.user_id }, include: {
            model: Publication,
            as: 'publicationcategories', // Make sure this matches the alias defined in the association
        },
    }).then(categoriesFound => {

        console.log(categoriesFound)




        res.status(200).json({
            message: 'Categories found!',
            categories: categoriesFound
        })

    }).catch(err => {

        console.log(err)

    })


}


exports.get_single_category = async (req, res, next) => {



    try {


        const foundCategory = await Category.findOne({
            where: { category_id: req.params.id, userId: req.userData.userId }, include: {
                model: Publication,
                as: 'publicationcategories', // Make sure this matches the alias defined in the association
            }
        });

        if (foundCategory) {

            res.status(200).json({
                message: 'Category found!',
                category: foundCategory
            })
        }

        else {
            res.status(400).json({
                message: 'Dit not found any category'
            })
        }


    } catch (err) {
        console.log(err)
    }


}

exports.delete_single_category = async (req, res, next) => {


    //Αρχικά βρίσκουμε την Κατηγορία προς διαγραφή
    const currentCategory = await Category.findOne({ where: { category_id: req.params.id, userId: req.userData.userId, state: 'Manual' } });
    console.log(currentCategory)

    if (currentCategory) {


        const uncategorizedFound = await Category.findOne({ where: { userId: req.userData.userId, state: 'Uncategorized' } })
        const publications = await currentCategory.getPublicationcategories();
        await uncategorizedFound.addPublicationcategories(publications)


        currentCategory.destroy().then(async num => {

            console.log(num)

            if (num) {

                res.status(201).json({
                    message: "Category Deleted!"
                })
            }

            else {
                res.status(201).json({
                    message: "Category was not found"
                })
            }


        })

    }



}


exports.delete_many_categories = async (req, res, next) => {


    const categories_id = req.body.categories_id;

    console.log(categories_id)

    for (let id of categories_id) {
        console.log(id)
    }

    const uncategorizedFound = await Category.findOne({ where: { userId: req.userData.userId, state: 'Uncategorized' } })


    for (let i of categories_id) {

        const currentCategory = await Category.findOne({ where: { category_id: i, userId: req.userData.userId, state: 'Manual' } });

        console.log(currentCategory)


        if (currentCategory) {
            const publications = await currentCategory.getPublicationcategories();

            if (publications) {
                await uncategorizedFound.addPublicationcategories(publications)

            }
        }



    }






    Category.destroy({ where: { category_id: categories_id, userId: req.userData.userId, state: 'Manual' } }).then(num => {



        if (num >= 1) {
            res.status(200).json({
                message: 'Deleted successfully!',
                num: num
            })
        }

        else {
            res.status(200).json({
                message: 'Did not found any categories'
            })
        }


    }).catch(err => {
        console.log(err)
    })




}


exports.update_category = async (req, res, next) => {




    const categoryFound = await Category.findOne({ where: { category_id: req.params.id, userId: req.userData.userId, state: 'Manual' } })

    console.log(req.body)

    const newCatObj = {
        name: req.body.name,
        description: req.body.description,

    }



    if (categoryFound) {
        Category.update(newCatObj, { where: { category_id: req.params.id, userId: req.userData.userId } }).then(categoryUpdated => {


            console.log(categoryUpdated[0])


            if (categoryUpdated[0] === 1) {

                res.status(200).json({
                    category_id: req.params.id,
                    message: 'Category updated successfully!'
                })

            }

            else {
                res.status(200).json({
                    message: 'Nothing changed'
                })
            }


        }).catch(err => {

            console.log(err)

        })
    }


    else {
        res.status(200).json({
            message: 'Category did not found'
        })
    }




}

exports.delete_publications_category = async (req, res, next) => {

    const categoryFound = await Category.findOne({ where: { category_id: req.params.id, userId: req.userData.userId } })


    if (categoryFound) {

        const publications = await categoryFound.getPublicationcategories();

        // Delete each publication from the system
        const deletionPromises = publications.map((publication) => publication.destroy());
        await Promise.all(deletionPromises);


        res.status(200).json({
            message: 'Publications deleted successfully!'
        })

    }
    else {
        res.status(401).json({
            message: 'Could not found category'
        })
    }



}