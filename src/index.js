const HotelClient = require('./HotelClient');


HotelClient.create('https://hotel-backend.azurewebsites.net/ImplementingServiceHotel.svc?wsdl')
  .then(async client => {
    //let result = await client.getAvailableHotels(new Date(), new Date(), 'Copenhagen')
    //let result = await client.findRooms(1, new Date(), new Date()).catch(console.error)
    client.client.on('message', (msg) => {
      console.log('msg', msg);
    })
    //let result = await client.createBooking(new Date(), new Date(), 12, [5, 6], 222333).catch(console.error)
    let result = await client.findBookings(222333).catch(console.error)
    console.log('result', result);
  });