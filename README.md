RL 18/12/2017
1. run 'npm run build' from the client folder
2. start dotnet server by running 'dotnet run' from the server folder  


For referrence the .net core server has been setup using below tutorial.


----------------

May 25, 2017/Delivering single page applications with ASPNET Core
.NET COREJAVASCRIPT
Delivering single page applications with ASPNET Core
Lately I’ve been building a lot of single page applications (SPAs) with JavaScript and using ASPNET Core MVC as both the file server and the API server. Although I’ve tried many permutations of how exactly to do this I would like to share the best and easiest way I have come to so far.

NOTE: You can find the final code for this tutorial here on Github.
Motivations
What I really want is an experience where I can develop my JavaScript application using any front-end technology and tooling I would like, and simply serve this up using .NET core. Although there are ways to use cshtml through an MVC view, often this means a lot of wrangling to take advantage of the automatic hashing and other features that come with using a tool like Webpack.

A good alternative approach to what I’m talking about here is provided by the Aspnet Core team called JavaSript Services. I’m not going to go into that in great detail but the main things I don’t like about that approach is that it’s too opinionated about how to build the application. Most of the provided Yoeman generators create apps that already have their own CLI (or CLI like tools) and it seems a little overkill to link everything all together like that. Your mileage may vary.

What I really want is to use ASPNET Core as my API as well as let it automatically serve up the index.html output from my Webpack build seamlessly. Fortunately this is really easy and I’m going to show you how.

Creating a project
This [example project] was created using two tools:

Create React App to create the React application
Dotnet CLI to create the basic Web API project
Set the environment variable ASPNETCORE_ENVIRONMENT=Development
This is really simple all you need to do is install the above two tools on your system (you will need Node >=6 installed on your machine) and run the following from a command line:

mkdir my-new-project-name
cd my-newproject-name
create-react-app client # this will take a few moments
dotnet new webapi -n MyNewProjectName -o server
Now you will have two folders ‘client’ and ‘server’ in a folder. Now lets look at adding

Tweak the client build
First thing I am going to do is add a couple of packages that will make copying the output from the client build to the server wwwroot a little easier. First lets install rimraf for cleaning the wwwroot folder and ncp for copy the files from ‘client/build’ to ‘server/wwwroot’. From the client folder of your project run the following:

cd client
npm install --save-dev rimram ncp
Now update your ‘scripts’ section in ‘client/packages.json’ to look like this:

"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "postbuild": "npm run copy-to-wwwroot",
  "test": "react-scripts test --env=jsdom",
  "eject": "react-scripts eject",
  "clean-server": "rimraf server/wwwroot",
  "copy-to-wwwroot": "npm run clean-server && ncp ./build ../server/wwwroot"
}
To test this worked run the following from the client folder of your project:

npm run build
Verify that there are now the same files in the folder ‘/client/build’ as there is in ‘server/wwwroot’.

Making the ASPNET site serve index.html
NOTE: I’m a bit of a maverick and like to try to build my apps without using Visual Studio now that it is possible. There will be times where I say to use the command line where you could just as easily use Visual Studio. For example installing packages or running the application. If you would rather do that then go ahead, otherwise just follow my instructions.
If you aren’t familiar with the Startup file and how it all works in ASPNET core have a look at the Application Startup in ASPNET Core article as it is a great introduction. In short the ‘Startup class configures the request pipeline that handles all requests made to the application.’ So it lets you configure various things about how your application will handle requests and we will take advantage of that by adding some middleware to allow us to serve up the production output of an app created with Create React App as well as use MVC6 to create our API.

If you look in ‘server/Program.cs’ you will see there is a call to the function UseStartup<Startup> that is telling the program to use the Startup class defined in Startup.cs.

Adding our custom middleware
To handle the the serving of index.html file in wwwroot we will add some very simple middleware. From the ASPNET Core Middleware documentation:

Middleware is software that is assembled into an application pipeline to handle requests and responses. Each component chooses whether to pass the request on to the next component
in the pipeline, and can perform certain actions before and after the next component is invoked in the pipeline.
So we are going to make some middleware that captures the requests, passes it on to the next middleware and after they have tried to handle the request will inspect the response to determine if the user was actually requesting a client side route.

See the following code:

app.Use(async (context, next) =>
{
    await next();

    if (context.Response.StatusCode == 404 && !Path.HasExtension(context.Request.Path.Value))
    {
        context.Request.Path = "/index.html";
    }
});
Lets walk through what this is doing.

await next().
This is passing the request on to the next middleware (could be anything).

if (context.Response.StatusCode == 404 && !Path.HasExtension(context.Request.Path.Value))

Since we awaited the next middleware we can now check if the status code is 404 AND the file path has no extension. This is important because we don’t want to return index.html if the request was actually for a CSS file or a
JavaScript file as this would be confusing and cause weird errors in our front end code potentially.

context.Request.Path = "/index.html";

If the above check was true then we change the path of the request to be index.html. The beauty of this is that is maintains the rest of the request so if the request is for
`/my-route’ then the resulting request will maintain that URL and therefore hand off the routing to the client. This is not perfect but I have built many apps now with this method
and have not really found any reason to fault it. If you are making requests to an API for example ‘api/values’ then the MVC middleware will pick this up and the test for the
status code will be false so this middleware will do nothing.

Now lets add this to our app. Find the line in the Configure method in your ‘server/Startup.cs’ file that says app.UseMvc(); and replace it with the following:

DefaultFilesOptions options = new DefaultFilesOptions();
options.DefaultFileNames.Clear();
options.DefaultFileNames.Add("index.html");
app.Use(async (context, next) =>
{
    await next();

    if (context.Response.StatusCode == 404 && !Path.HasExtension(context.Request.Path.Value))
    {
        context.Request.Path = "/index.html";
    }
});

app.UseMvc();
app.UseDefaultFiles(options);
app.UseStaticFiles();
As you can see there are a few extra lines in there from our basic middleware example above. All it is really doing is setting up the static file server with some basic options.

If you tried to run this it would fail because you need the package ‘Microsoft.AspNetCore.StaticFiles’ installed. Open a command line and from the ‘server’ folder run:

dotnet add package Microsoft.AspNetCore.StaticFiles
This will add the package to your project including it in your csproj file. To test this worked run this from the ‘server’ folder:

dotnet run
If you open the browser at http://locahost:3000 you should see the app running nicely! Also if you visit http://locahost:3000/api/values you should see the default values api response (and not the client side app).

Adding an API call to client
There are many ways you could set this up but for a Create React App I have found this is the easiest and most configurable way. The first thing we need to do is be able to make the client app request from ‘localhost:5000’ during development and request from the same url as the app is hosted during production. This is because during development we are using webpack-dev-server to serve up our assets (via Create React Apps react-scripts) and in production we are using the ASPNET Core app.

To do this follow these steps:

Add a dotenv file
Create React App lets you add environment variables using a package called dotenv. If you want to know more read the docs for dotenv and
the docs for Create React App
but all you need to know is in the ‘client’ folder add a new blank file called ‘.env’ and a file called ‘.env.development’ with the contents:

REACT_APP_API_HOST=http://localhost:5000
This will give you access to that value on the variable process.env.REACT_APP_API_HOST inside your client side application code.

Add a ApiConfig

To make it a little easier (and so I don’t have to configure the production API_HOST if O change URLS or have staging servers) I create a file at ‘/client/src/api/apiConfig’ with the following
value:

export const ApiConfig = {
    host: process.env.REACT_APP_API_HOST ? process.env.REACT_APP_API_HOST : window.location.origin
}
export default ApiConfig
Basically I am just saying, if the process.env.REACT_APP_API_HOST value is set then use it as the host value otherwise use the current window.location.origin of the browser.
Since our .env default file is empty then when we are not in development (IE when we run npm run build) this will be compiled as ApiConfig.host = window.location.origin and
achieve what we set out to achieve.

Add a values API function

Now lets create a file ‘/client/src/api/values.js’ with the following content:

import ApiConfig from './apiConfig'
const valuesEndpoint = `${ApiConfig.host}/api/values`

export const getValues = async () => {
    var response = await fetch(valuesEndpoint)
    return await response.json()
}
I am using the Fetch API here in order to make a request to the server and as you can see I am using the ApiConfig.host value
that we set up earlier. Luckily Create React App has out of the box support for ES2017 Async Await syntax which means we don’t need to use callbacks or promises anymore! For more on
this new language feature see
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

Add the values API call to App.js

The final thing to do with the client is to actually call this in our app. Simply replace the content of ‘/client/src/App.js’ with the following:

import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { getValues } from './api/values'

class App extends Component {
 constructor(){
   super();
   this.state = {
     values: []
   }
 }
 async componentWillMount(){
   var data = await getValues()
   this.setState(({values: data}))
 }
 render() {
   const { values } = this.state
   return (
     <div className="App">
       <div className="App-header">
         <img src={logo} className="App-logo" alt="logo" />
         <h2>Welcome to React</h2>
       </div>
       <ul style={{paddingLeft:0}}>
          {values.map((value)=>(
            <li style={{'listStyle': 'none'}} key={value}>
              {value}
            </li>
          ))}
       </ul>
     </div>
   );
 }
}

export default App;   
I won’t go into the details of this file as its pretty standard vanilla react but its essentially calling the API function and printing the values out as a list.

Adding CORS to our server
Now if you try to run the app at the moment like this (in two different command windows):

From the server folder

dotnet run
From the client folder

npm start
You’ll notice that you get an error relating to Fetch API and CORS. In Chrome I get the following:

Fetch API cannot load http://localhost:5000/api/values. No ‘Access-Control-Allow-Origin’ header is present on the requested resource. Origin ‘http://localhost:3000’
is therefore not allowed access. If an opaque response serves your needs, set the request’s mode to ‘no-cors’ to fetch the resource with CORS disabled.
Oh no! Nevermind this is easy to fix. Follow these steps to update your Startup.cs file:

Storing the HostingEnvironment in a class property
Replace the section that looks like this:

public Startup(IHostingEnvironment env)
{
    var builder = new ConfigurationBuilder()
        .SetBasePath(env.ContentRootPath)
        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
        .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
        .AddEnvironmentVariables();
    Configuration = builder.Build();
}
With this:

public Startup(IHostingEnvironment env)
{
    var builder = new ConfigurationBuilder()
        .SetBasePath(env.ContentRootPath)
        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
        .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
        .AddEnvironmentVariables();
    HostingEnvironment = env;
    Configuration = builder.Build();
}
public IHostingEnvironment HostingEnvironment { get; private set; }
All we are doing here is making the HostingEnvironment available as a property so we can access it in the next step.

Define our CORS policy in ConfigureServices

At the beginning of the ConfigureServices method add the following to define a CORS policy called “AllowDevelopment” that is only created when the app is
running in development mode (ie environment variable ASPNETCORE_ENVIRONMENT=Development)

if (HostingEnvironment.IsDevelopment())
{
    services.AddCors(options => options.AddPolicy("AllowDevelopment", 
        p => p.WithOrigins("http://localhost:3000")
        .AllowAnyMethod()
        .AllowAnyHeader()));
}
Add the CORS Middleware
The last step is to add the CORS middleware to our app. After the lines:

loggerFactory.AddConsole(Configuration.GetSection("Logging"));
loggerFactory.AddDebug();  
Add the following:

if (HostingEnvironment.IsDevelopment())
{
  app.UseCors("AllowDevelopment");
}
This adds the Cors middleware with the policy defined earlier but once again only in development mode. Now we are done!

Running the final app
If you have been following on (or if you clone the final product from here) you should now be able to run the the client and the server in two command windows and see the values from
the api printed out on in the client app. To do this:

From the server folder

dotnet run
From the client folder

npm start
Now if you want you could run the npm run build command in the client folder and then load the production version in the app at the server url http://localhost:5000.

In my next article I am going to write about how to secure this using Azure Active Directory B2C which is a cool auth as a service offering from Azure! This will complete the example and really create the basis for a real world SPA app.

The source code for this tutorial is here

