import RPC from "./RPC";
import { JSON_RPC_VERSION, JSON_RPC_ERROR_CODES } from "./constants";
import {
  Message,
  RpcConfig,
  ResMessage,
  ReqMessage,
  CallBackHandler,
} from "./types";

class ProxyRPC extends RPC {
  private readonly win: Window;
  private port: chrome.runtime.Port | undefined = undefined;

  constructor(win: Window, config: RpcConfig) {
    super(config);
    this.win = win;
    this.proxyResponse = this.proxyResponse.bind(this);
    this.receiveMessage = this.receiveMessage.bind(this);
  }

  private proxyResponse(resMessage: ResMessage): void {
    resMessage.target = this.target;
    resMessage.data.name = this.name;

    this.sendMessage(resMessage);
  }

  private sendPortMessage(message: Message): void {
    this.connectPort();

    if (this.port) {
      this.port.postMessage(message);
    }
  }

  protected sendMessage(message: Message): void {
    this.win.postMessage(message, "*");
  }

  private receiveMessage(event: MessageEvent): void {
    super.onMessage(event.data);
  }

  protected onRequestMessage(message: ReqMessage): void {
    const resMessage: ResMessage = {
      target: this.target,
      data: {
        name: this.name,
        data: {
          id: message.data.data.id,
          jsonrpc: JSON_RPC_VERSION,
        },
      },
    };

    try {
      const handler = this.handlers.get(message.data.data.method);

      if (!handler) {
        this.sendPortMessage(message);
        return;
      }

      const callback: CallBackHandler = (err, res) => {
        if (err) {
          resMessage.data.data.error = err;
          this.sendMessage(resMessage);
          return;
        }

        resMessage.data.data.result = res;
        this.sendMessage(resMessage);
      };

      handler(
        {
          callback,
          message,
        },
        ...message.data.data.params
      );
    } catch (error) {
      if (resMessage.data.data.hasOwnProperty("error")) return;
      if (resMessage.data.data.hasOwnProperty("result")) return;

      resMessage.data.data.error = {
        code: JSON_RPC_ERROR_CODES.SERVER_ERROR,
        message: error.toString(),
      };

      this.sendMessage(resMessage);
    }
  }

  connectPort() {
    if (this.port) {
      return;
    }

    this.port = chrome.runtime.connect({ name: this.name });

    if (this.port) {
      this.port.onMessage.addListener(this.proxyResponse);
      this.port.onDisconnect.addListener(() => {
        if (this.port) {
          this.port.onMessage.removeListener(this.proxyResponse);
        }
        this.port = undefined;
      });
    }
  }

  start(): void {
    this.win.addEventListener("message", this.receiveMessage);

    this.connectPort();
  }

  stop(): void {
    super.stop();
    this.win.removeEventListener("message", this.receiveMessage);

    if (this.port) {
      this.port.onMessage.removeListener(this.proxyResponse);
    }
  }
}

export default ProxyRPC;
