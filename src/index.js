import { greet } from "./greeter/greeter";
import {config} from "./env";
import { Authentication } from "./auth/authentication";
import { StorageFactory } from "./storage/storage";

import { ListObjectsCommand } from "@aws-sdk/client-s3"

const auth = new Authentication(config.userPoolId, config.identityId, config.webClientId, config.region);
const storageFactory = new StorageFactory(config.region, config.bucket, config.directoryPrefix, async () => await auth.getCredentials());

const helloBar = document.querySelector("#hello");

const registerRequest = {
    email: "lwk50495@zslsz.com",
    password: "1234qwer",
    website: "jkan.pl"
}

const confirmRequest = {
    email: registerRequest.email,
    code: '938781'
}

const loginRequest = {
    email: registerRequest.email,
    password: registerRequest.password,
}


const confirmBtn = document.querySelector('#confirm')
confirmBtn.addEventListener('click', () => {
    auth.confirm(confirmRequest)
        .then(resp => console.log(resp))
        .catch(err => console.log(err));
});

const registerBtn = document.querySelector('#register')
registerBtn.addEventListener('click', () => {
    auth.register(registerRequest)
        .then(resp => console.log(resp))
        .catch(err => console.log(err));
});

const loginBtn = document.querySelector("#login");
loginBtn.addEventListener('click', () => {
    auth.login(loginRequest)
    .then(resp => auth.getCurrentUser())
    .then(profile => helloBar.textContent = `Hello ${profile.email}`)
    .catch(err => console.log(err));
});

const logout = document.querySelector("#logout");
logout.addEventListener('click', () => {
    auth.logout()
        .then(resp => helloBar.textContent = `Hello Guest`)
})

const listBucketsBtn = document.querySelector('#listBuckets');
listBucketsBtn.addEventListener('click', async () => {
    const s3 = await storageFactory.createCredentialsAwareS3();
    const response = await s3.send(new ListObjectsCommand({
        Bucket: config.bucket,    
    }));

    console.log(response.Contents.map(file => file.Key));
});

const createPhotoPreview = (photo) => {
    const element = document.createElement('div');
    element.innerHTML = `
        <li>
            <img width="200" src="${photo.publicUrl}"/>
        </li>
    `.trim();

    return element.firstChild;
}

const uploadBtn = document.querySelector('#upload');
const filesInput = document.querySelector('#files');
const photoIndex = document.querySelector('#index ul');

uploadBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!filesInput.files.length > 0) {
        return;
    }

    const userStorage = await storageFactory.createUserStorage();
    const toBeUploaded = [...filesInput.files];
    
    toBeUploaded.forEach(async (file) => {
        userStorage.upload(file)
            .then(data => userStorage.getPublicUrl(data.key))
            .then(publicUrl => {
                photoIndex.prepend(createPhotoPreview({publicUrl}))
            })
    });
});

(() => {

})();

document.addEventListener('DOMContentLoaded', () => {
    auth.getCurrentUser()
        .then(profile => helloBar.textContent = `Hello ${profile.email}`)
        .then(async () => {
            const userStorage = await storageFactory.createUserStorage();
            const allPhotos = await userStorage.getMyFiles();
            allPhotos.forEach(async photo => {
                photoIndex.appendChild(createPhotoPreview({publicUrl: await userStorage.getPublicUrl(photo.Key)}));
            });
                
               
        })
        .catch(err => console.log(err))
    ;
});