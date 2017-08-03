import { IContainerModuleOpts } from "../../container";
import { IServerRequest, IServerResponse, RestifyServerController } from "../../modules";
import { IntegerField, StringField } from "../../lib/validate";

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

  protected getInformation(req: IServerRequest, res: IServerResponse): Promise<IServerInformation> {
    return new Promise((resolve, reject) => {
      const url = req.urlParameters<IServerInformationUrl>();
      this.debug(url);
      resolve({ hello: "world" });
    });
  }

}
