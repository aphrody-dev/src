---
source_url: https://web.dev/articles/codelab-notifications-service-worker
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:08+00:00
sha256: f780a5a53e892cb2ad9dbb99bddf7e1cadb7d2dbf998e483b8f97064a4128012
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Kate Jeffreys

In this codelab, you'll use a service worker
to manage [notifications](https://web.dev/articles/use-push-notifications-to-engage-users.md.txt).
The instructions here assume that you're already familiar with
service workers and the basics of requesting notification permission and sending notifications.
If you need a refresher on notifications, see the
[Get started with the Notifications API](https://web.dev/articles/codelab-notifications-get-started.md.txt)
codelab. To learn more about service workers, see Matt Gaunt's [Introduction to service workers](https://developer.chrome.com/docs/workbox/service-worker-overview).

## Get familiar with the sample app and starting code

Start by looking at the live app in the new Chrome tab:

1. Press \`Control+Shift+J\` (or \`Command+Option+J\` on Mac) to open DevTools.
2. Click the **Console** tab.

3. Make sure that the **Info** option is selected in the **Levels** dropdown
   next to the **Filter** box.

4. In the DevTools console for your live app, you should see a console message:

   `TODO: Implement getRegistration()`.

   This is a message from a function stub that you will implement in this codelab.

Now let's take a look at the sample app's code.

1. Take a look at `public/index.js`:

   - There are four stubs for the functions you will implement: `registerServiceWorker`, `getRegistration`, `unRegisterServiceWorker`, and `sendNotification`.

   - The `requestPermission` function requests the user's permission to send notifications. If you did the [Get started with the Notifications API codelab](https://web.dev/articles/codelab-notifications-get-started.md.txt), you'll notice that its `requestPermission` function is used here. The only difference is that it now also updates the user interface after resolving the permission request.

   - The `updateUI` function refreshes all the app's buttons and messages.

   - The `initializePage` function performs feature detection for service worker capability in the browser and updates the app user interface.

   - The script waits until the page has loaded and then initializes it.

2. Open `public/service-worker.js`.

   As the name suggests, you'll add code to the app to register this file as a
   [service worker](https://developer.chrome.com/docs/workbox/service-worker-overview).

   Although the file is not yet in use by the app, it contains some starting code that will print a message to the console when the service worker is activated.

   You'll add code to `public/service-worker.js` to handle notifications when the service worker receives them.

## Register the service worker

In this step, you'll write code that runs
when the user clicks **Register service worker** in the app UI.
This code will register `public/service-worker.js` as a service worker.

> [!NOTE]
> **Note:** In a real app, you'd just register the service worker automatically from your app's landing page instead of requiring the user to click a button. For the purposes of this codelab, you'll build an app that you can play with and observe how the service worker interacts with notifications.

1. Open `public/index.js`.
   Replace the `registerServiceWorker` function with the following code:

   ```javascript
   // Use the Service Worker API to register a service worker.
   async function registerServiceWorker() {
     await navigator.serviceWorker.register('./service-worker.js')
     updateUI();
   }
   ```

   Note that `registerServiceWorker` uses the [`async function`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/async_function) declaration to make handling promises more convenient. This lets you `await` the resolved value of a `Promise`. For example, the function above awaits the outcome of registering a service worker before updating the UI. See [`await` on MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/await) for more information.
2. Now that the user can register a service worker, you can get a reference to the service worker registration object. In `public/index.js`, replace the `getRegistration` function with the following code:

   ```javascript
   // Get the current service worker registration.
   function getRegistration() {
     return navigator.serviceWorker.getRegistration();
   }
   ```

   The function above uses the
   [Service Worker API](https://developer.mozilla.org/docs/Web/API/Service_Worker_API)
   to get the current service worker registration, if it exists.
   It makes getting a reference to the service worker registration a bit more convenient.

- To complete the service worker registration functionality, add code to unregister the service worker. Replace the `unRegisterServiceWorker` function with the following code:

  ```javascript
  // Unregister a service worker, then update the UI.
  async function unRegisterServiceWorker() {
    // Get a reference to the service worker registration.
    let registration = await getRegistration();
    // Await the outcome of the unregistration attempt
    // so that the UI update is not superceded by a
    // returning Promise.
    await registration.unregister();
    updateUI();
  }
  ```

In the tab where you're viewing the live app, reload the page. The **Register service worker** and **Unregister service worker** buttons should now be working.

## Send notifications to the service worker

In this step, you'll write code that will run when the user clicks **Send a notification** in the app UI. This code will create a notification, check that a service worker is registered, and then send the notification to the service worker using its `postMessage` method.

Open `public/index.js` and
replace the `sendNotification` function with the following code:

```javascript
// Create and send a test notification to the service worker.
async function sendNotification() {
  // Use a random number as part of the notification data
  // (so you can tell the notifications apart during testing!)
  let randy = Math.floor(Math.random() * 100);
  let notification = {
    title: 'Test ' + randy,
    options: { body: 'Test body ' + randy }
  };
  // Get a reference to the service worker registration.
  let registration = await getRegistration();
  // Check that the service worker registration exists.
  if (registration) {
    // Check that a service worker controller exists before
    // trying to access the postMessage method.
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(notification);
    } else {
      console.log('No service worker controller found. Try a soft reload.');
    }
  }
}
```

Here's what that code is doing:

- `sendNotification` is an asynchronous function, so you can use `await` to get a reference to the service worker registration.

- The service worker's `postMessage` method sends data from the app to the service worker. See the [MDN documentation on postMessage](https://developer.mozilla.org/docs/Web/API/Worker/postMessage) for more information.

- The code checks for the presence of the `navigator.serviceWorker.controller` property before trying to access the `postMessage` function. `navigator.serviceWorker.controller` will be `null` if there is no active service worker, or if the page has been force refreshed (`Shift+`**Reload** ). See the [ServiceWorker controller documentation on MDN](https://developer.mozilla.org/docs/Web/API/ServiceWorkerContainer/controller) for more information.

## Handle notifications in the service worker

In this step, you'll write code in the service worker that will handle messages posted to it and display notifications to the user.

Open `public/service-worker.js`. Add the following code to the end of the file:

```javascript
// Show notification when received
self.addEventListener('message', (event) => {
  let notification = event.data;
  self.registration.showNotification(
    notification.title,
    notification.options
  ).catch((error) => {
    console.log(error);
  });
});
```

Here's a quick explanation:

- `self` is a reference to the service worker itself.

- While the service worker now handles displaying notifications, the main app UI is still responsible for getting notification permission from the user. If permission is not granted, the promise returned by `showNotification` is rejected. The code above uses a `catch` block to avoid an uncaught `Promise` rejection error and handle this error a little more gracefully.

Go on to the next codelab in this series: [Build a push notifications server](https://web.dev/articles/codelab-notifications-push-server.md.txt).
