"use strict";
/* -------------------------------------------------------
    NODEJS EXPRESS | CLARUSWAY FullStack Team
------------------------------------------------------- */
// Reservation Controller:

const Reservation = require("../models/reservation");
const Car = require("../models/car");

module.exports = {
  list: async (req, res) => {
    /*
            #swagger.tags = ["Reservations"]
            #swagger.summary = "List Reservations"
            #swagger.description = `
                You can send query with endpoint for filter[], search[], sort[], page and limit.
                <ul> Examples:
                    <li>URL/?<b>filter[field1]=value1&filter[field2]=value2</b></li>
                    <li>URL/?<b>search[field1]=value1&search[field2]=value2</b></li>
                    <li>URL/?<b>sort[field1]=1&sort[field2]=-1</b></li>
                    <li>URL/?<b>page=2&limit=1</b></li>
                </ul>
            `
        */

    const data = await res.getModelList(Reservation);

    res.status(200).send({
      error: false,
      details: await res.getModelListDetails(Reservation),
      data,
    });
  },
  listAvailableCars: async (req, res) => {
    /*
        #swagger.tags = ["Cars"]
        #swagger.summary = "List Available Cars"
        #swagger.description = "List cars available for reservation within a specified date range."
        #swagger.parameters['query'] = {
            startDate: { description: "Start date for the reservation", type: "string", format: "date", required: true },
            endDate: { description: "End date for the reservation", type: "string", format: "date", required: true }
        }
    */

    const { startDate, endDate } = req.body;
    

    try {
        // Rezerve edilmemiş araçları bul
        const availableCars = await Car.find({
            _id: { $nin: await Reservation.distinct('carId', {
                $or: [
                    { startDate: { $gte: startDate, $lte: endDate } },
                    { endDate: { $gte: startDate, $lte: endDate } }
                ]
            })}
        });

        res.status(200).send({
            error: false,
            data: availableCars
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: true,
            message: "An error occurred while listing available cars."
        });
        
    }

},

  create: async (req, res) => {
    /*
            #swagger.tags = ["Reservations"]
            #swagger.summary = "Create Reservation"
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    $ref: '#/definitions/Reservation'
                }
            }
        */

    // "Admin/staf değilse" veya "UserId göndermişmemişse" req.user'dan al:
    if ((!req.user.isAdmin && !req.user.isStaff) || !req.body?.userId) {
      req.body.userId = req.user._id;
    }

    // createdId ve updatedId verisini req.user'dan al:
    req.body.createdId = req.user._id;
    req.body.updatedId = req.user._id;

    // REZERVASYON VALİDASYONU
    let { startDate, endDate, amount, carId } = req.body;

    const currentDate = Date.now();
    const start = new Date(startDate); //! startDate in milliseconds
    const end = new Date(endDate); //! endDate in
    const notPassed = currentDate > start || currentDate > end;
    const invalidDate = start > end;

    if (notPassed || invalidDate) {
      res.errorStatusCode = 400;
      throw new Error("Please enter valid dates");
    }


    const reservedCars = await Reservation.find({carId,
      $nor: [
        { startDate: { $gt: req.body.endDate } },
        { endDate: { $lt: req.body.startDate } },
      ],
    })

    console.log(reservedCars);
//    const reservedCarIds=reservedCars.filter
if(reservedCars.length>0){
    res.errorStatusCode=400
    throw new Error("Car is not available these dates try another car");

}



    const data = await Reservation.create(req.body);

    res.status(201).send({
      error: false,
      data,
    });
  },

  read: async (req, res) => {
    /*
            #swagger.tags = ["Reservations"]
            #swagger.summary = "Get Single Reservation"
        */

    res.status(200).send({
      error: false,
      data,
    });
  },

  update: async (req, res) => {
    /*
            #swagger.tags = ["Reservations"]
            #swagger.summary = "Update Reservation"
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    $ref: '#/definitions/Reservation'
                }
            }
        */

    // Admin değilse rezervasyona ait userId değiştirilemez:
    if (!req.user.isAdmin) {
      delete req.body.userId;
    }

    // updatedId verisini req.user'dan al:
    req.body.updatedId = req.user._id;

    res.status(202).send({
      error: false,
      data,
      new: await Reservation.findOne({ _id: req.params.id }),
    });
  },

  delete: async (req, res) => {
    /*
            #swagger.tags = ["Reservations"]
            #swagger.summary = "Delete Reservation"
        */

    const data = await Reservation.deleteOne({ _id: req.params.id });

    res.status(data.deletedCount ? 204 : 404).send({
      error: !data.deletedCount,
      data,
    });
  },
};
