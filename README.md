## assistant-authentication

assistant-authentication is an [AssistantJS][1] component which helps you to deal with authentication in your states. With assisatant-authentication, you are able to define your own authentication strategy and link it to your intents / states through the `@authenticate` decorator.

Unfortunately, the usage of assistant-authentication is not yet documented :-(. But there is an example integration in our [bootstrap repository][2]:

1.  Integration: https://github.com/webcomputing/assistant-bootstrap/blob/master/index.ts#L17, https://github.com/webcomputing/assistant-bootstrap/blob/master/index.ts#L29, https://github.com/webcomputing/assistant-bootstrap/blob/master/index.ts#L41
2.  Implementing your own authentication strategies: https://github.com/webcomputing/assistant-bootstrap/blob/master/app/auth-strategies/oauth.ts (oauth-example). Be sure to add your strategies into a folder called `auth-strategies` inside your `app` folder. That way, they are loaded automatically.
3.  Usage in states: https://github.com/webcomputing/assistant-bootstrap/blob/master/app/states/game.ts#L19

[1]: http://assistantjs.org
[2]: https://github.com/webcomputing/assistant-bootstrap
