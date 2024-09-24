import RPC from "./RPC";
import { Message, RpcConfig } from "./types";

class PortRPC extends RPC {
  private port: chrome.runtime.Port | undefined = undefined;

  constructor(config: RpcConfig) {
    super(config);
    this.receiveMessage = this.receiveMessage.bind(this);
  }

  protected sendMessage(message: Message): void {
    this.connectPort();

    if (this.port) {
      this.port.postMessage(message);
    }
  }

  private receiveMessage(message: any): void {
    super.onMessage(message);
  }

  connectPort() {
    if (this.port) {
      return;
    }

    this.port = chrome.runtime.connect({ name: this.name });

    if (this.port) {
      this.port.onMessage.addListener(this.receiveMessage);
      this.port.onDisconnect.addListener(() => {
        if (this.port) {
          this.port.onMessage.removeListener(this.receiveMessage);
        }
        this.port = undefined;
      });
    }
  }

  start(): void {
    this.connectPort();
  }

  stop(): void {
    super.stop();

    if (this.port) {
      this.port.onMessage.removeListener(this.receiveMessage);
    }
  }
}

export default PortRPC;
