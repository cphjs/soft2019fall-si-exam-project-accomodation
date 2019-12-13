const HotelClient = require('./HotelClient');
const MqClient = require('./MqClient');


Promise.all([
  HotelClient.create('https://hotel-backend.azurewebsites.net/ImplementingServiceHotel.svc?wsdl'),
  MqClient.create('amqp://localhost')
])
  .then(values => {
    let hotelClient, mqClient;
    [hotelClient, mqClient] = values;

    return mqClient.onAvailabilityRequest(async params => {
      console.log('received hotel availability request', params)
      let hotels = await hotelClient.getAvailableHotels(new Date(params.startDate), new Date(params.endDate), params.city);
      console.log('received hotel list from remote service', hotels.length, params.sessionID);

      mqClient.sendHotelResultMessage({
        sessionID: params.sessionID,
        hotels: hotels,
      })
      console.log('published hotel list for', params.sessionID);
    })
  });
