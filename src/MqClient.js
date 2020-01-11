const amqplib = require('amqplib');

module.exports = class MqClient {

  constructor() {
    this.connection = null;
  }

  async connect(host) {
    this.connection = await amqplib.connect(host);
    this.channel = await this.connection.createChannel();
  }

  async on(queue, cb) {
    await this.channel.assertQueue(queue);
    await this.channel.consume(queue, msg => {
      if (msg === null) {
        this.channel.nack(msg);
        return;
      }
      this.channel.ack(msg);
      const payload = JSON.parse(msg.content.toString());
      console.log(`[Rabbit][${queue}] Received payload:`, payload)
      cb(payload);
    });
  }

  async send(queue, data) {
    await this.channel.assertQueue(queue);
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)))
    console.log(`[Rabbit][${queue}] Sent payload`, data);
  }

  async onAvailabilityRequest(cb) {
    return this.on('availability', cb);
  }

  async sendHotelResultMessage(data) {
    await this.send('availabilityResults', data);
  }


  static async create(host) {
    let c = new MqClient();
    await c.connect(host);
    return c;
  }

}