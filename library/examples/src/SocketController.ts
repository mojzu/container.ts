import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/range";
import "rxjs/add/operator/map";
import { IContainerModuleOpts } from "../../container";
import { IServerSocket, SocketioServerController } from "../../modules";
import { IntegerField, StringField } from "../../lib/validate";

export interface IServerInformationRequest {
  place: number;
}

export interface IServerInformationResponse {
  hello: string;
}

export class SocketController extends SocketioServerController {

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    this.server.registerHandler<IServerInformationRequest>({
      event: "information",
      schema: {
        request: {
          place: new IntegerField(),
        },
        response: {
          hello: new StringField(),
        },
      },
    }, this.informationHandler.bind(this));
  }

  protected informationHandler(
    socket: IServerSocket,
    data: IServerInformationRequest,
  ): Observable<IServerInformationResponse> {
    this.debug(data);
    return Observable.range(0, 3)
      .map(() => { return { hello: "world" } });
  }

}
