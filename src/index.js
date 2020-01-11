const path = require('path');
const env = require('process').env;
const fs = require('fs');
const HotelClient = require('./HotelClient');
const MqClient = require('./MqClient');

const STORAGE_DIR = env.STORAGE_DIR || path.resolve(__dirname, '../');
const STORAGE_PATH = path.resolve(STORAGE_DIR, 'event_passport_map.json');


Promise.all([
  HotelClient.create('https://hotel-backend.azurewebsites.net/ImplementingServiceHotel.svc?wsdl'),
  MqClient.create('amqp://localhost')
])
  .then(async ([hotelClient, mqClient]) => {

    await mqClient.onAvailabilityRequest(async params => {
      let hotels = await hotelClient.getAvailableHotels(new Date(params.startDate), new Date(params.endDate), params.city);
      console.log('received hotel list from remote service', hotels.length, params.sessionID);

      mqClient.sendHotelResultMessage({
        sessionID: params.sessionID,
        hotels: hotels,
      })
    })

    await mqClient.on('rooms', async params => {
      let rooms = await hotelClient.findRooms(params.hotelId, new Date(params.startDate), new Date(params.endDate));

      mqClient.send('roomsResults', {
        sessionID: params.sessionID,
        hotelId: params.hotelId,
        rooms,
      })
    });

    await mqClient.on('booking', async params => {
      let success = await hotelClient.createBooking(new Date(params.startDate),
        new Date(params.endDate),
        params.numGuests,
        params.roomIds,
        params.passportNumber
      );

      if (success) {
        await setPassportNumber(params.eventId, params.passportNumber);
      }

      mqClient.send('bookingResults', {
        sessionID: params.sessionID,
        success,
      });
    });

    await mqClient.on('bookingList', async params => {
      let passportNumber = await getPassportNumber(params.eventId);

      let bookings = await hotelClient.findBookings(passportNumber);

      mqClient.send('bookingListResults', {
        sessionID: params.sessionID,
        eventId: params.eventId,
        bookings,
      })
    });

  });


async function getPassportNumber(eventId) {
  let mapping = await readEventToPassportMapping();
  return mapping[eventId];
}

async function setPassportNumber(eventId, passportNumber) {
  let mapping = await readEventToPassportMapping();
  mapping[eventId] = passportNumber;
  await writeEventToPassportMapping(mapping);
}

async function readEventToPassportMapping() {
  return new Promise((resolv, reject) => {
    fs.access(STORAGE_PATH, (err) => {
      if (err) return resolv({});

      fs.readFile(STORAGE_PATH, (err, data) => {
        if (err) reject(err);
        else {
          try {
            resolv(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        }
      });
    });
  })
}
async function writeEventToPassportMapping(mapping) {
  return new Promise((resolv, reject) => {
    fs.writeFile(STORAGE_PATH, JSON.stringify(mapping), err => {
      if (err) reject(err);
      else resolv();
    })
  });
}