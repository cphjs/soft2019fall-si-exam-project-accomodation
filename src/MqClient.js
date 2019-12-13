const amqplib = require('amqplib');

module.exports = class MqClient {

  constructor() {
    this.connection = null;
  }

  async connect(host) {
    this.connection = await amqplib.connect(host);
    this.channel = await this.connection.createChannel();
  }


  async onAvailabilityRequest(cb) {
    await this.channel.assertQueue('availability');
    await this.channel.consume('availability', msg => {
      if (msg === null) return;
      cb(JSON.parse(msg.content.toString()));
    });
  }

  async sendHotelResultMessage(data) {
    await this.channel.assertQueue('availabilityResults');
    this.channel.sendToQueue('availabilityResults', Buffer.from(JSON.stringify(data)))
  }


  static async create(host) {
    let c = new MqClient();
    await c.connect(host);
    return c;
  }

}