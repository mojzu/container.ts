import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import { IContainerModuleOpts } from "container.ts";
import { IntegerField, StringField } from "container.ts/lib/validate";
import { IServerRequest, IServerResponse, RestifyServerController } from "./wrappers/RestifyServer";

export interface IServerInformationUrl {
  place: number;
}

export interface IServerInformation {
  hello: string;
}

export class ServerController extends RestifyServerController {

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    this.server.get<IServerInformation>({
      name: "Information",
      path: ["hello", ":place"],
      schema: {
        url: {
          place: new IntegerField(),
        },
        response: {
          hello: new StringField(),
        },
      },
    }, this.getInformation.bind(this));
  }

  protected getInformation(req: IServerRequest, res: IServerResponse): Observable<IServerInformation> {
    const url = req.urlParameters<IServerInformationUrl>();
    this.debug(url);
    return Observable.of({ hello: "world" });
  }

}
