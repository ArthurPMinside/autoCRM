FROM reactnativecommunity/react-native-android:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN cd android && ./gradlew assembleRelease

CMD ["cp", "android/app/build/outputs/apk/release/app-release.apk", "/output/autocrm.apk"]
