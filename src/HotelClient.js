const soap = require('soap');

class HotelClient {

  constructor(client) {
    this.client = client;
  }

  async getAvailableHotels(startDate, endDate, city) {
    let result = (await this.client.FindAvailableHotelsAsync({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      city,
    }))[0];
    return result && result.FindAvailableHotelsResult ? result.FindAvailableHotelsResult.HotelDetails : [];
  }

  async findRooms(hotelId, startDate, endDate, roomType = null) {
    let result = (await this.client.FindRoomsAsync({
      hotel: {
        ID: hotelId
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      roomType,
    }))[0];
    return result.FindRoomsResult ? result.FindRoomsResult : [];
  }

  async createBooking(startDate, endDate, numGuests, roomIds, passportNumber) {
    let result = (await this.client.CreateBookingAsync({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      numberGuest: numGuests,
      listOfRooms: {
        attributes: {
          'xmlns:d4p1': "http://schemas.datacontract.org/2004/07/HotelInterface.DTOs",
          'xmlns:i': 'http://www.w3.org/2001/XMLSchema-instance',
        },
        $xml: roomIds.map(r => `<d4p1:RoomIdentifier><d4p1:ID>${r}</d4p1:ID></d4p1:RoomIdentifier>`).join(""),
      },
      passportNumber: passportNumber,
    }))[0];
    return result.CreateBookingResult ? result.CreateBookingResult : false;
  }

  async findBookings(passportNumber) {
    let result = (await this.client.FindBookingsAsync({
      // Weird casing is important
      passPortNUmber: passportNumber
    }))[0];
    return result.FindBookingsResult && result.FindBookingsResult.BookingDetails ? result.FindBookingsResult.BookingDetails : [];
  }

  static async create(wsdlUrl) {
    return new HotelClient(await soap.createClientAsync(wsdlUrl));
  }

}

module.exports = HotelClient;