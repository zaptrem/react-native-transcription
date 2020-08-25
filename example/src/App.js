import * as React from 'react';
import { NativeEventEmitter, StyleSheet, View, Text, Button } from 'react-native';
import Transcription from 'react-native-transcription';
import { check, PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import RNBackgroundDownloader from 'react-native-background-downloader';
import * as Progress from 'react-native-progress';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      result: "Download the model files then tap start."
    }// Don't call this.setState() here! 

    let lostTasks = RNBackgroundDownloader.checkForExistingDownloads().then((lostTasks) => {
      for (let task of lostTasks) {
        console.log(`Task ${task.id} was found!`);
        task.progress((percent) => {
          console.log(`Downloaded: ${percent * 100}%`);
        }).done(() => {
          console.log('Downlaod is done!');
        }).error((error) => {
          console.log('Download canceled due to error: ', error);
        });
      }
    });


    check(PERMISSIONS.IOS.MICROPHONE)
      .then((result) => {
        switch (result) {
          case RESULTS.UNAVAILABLE:
            console.log(
              'This feature is not available (on this device / in this context)',
            );
            break;
          case RESULTS.DENIED:
            console.log(
              'The permission has not been requested / is denied but requestable',
            );
            request(PERMISSIONS.IOS.MICROPHONE);
            break;
          case RESULTS.GRANTED:
            console.log('The permission is granted');
            break;
          case RESULTS.BLOCKED:
            console.log('The permission is denied and not requestable anymore');
            break;
        }
      })
      .catch((error) => {
        // …
      });

    check(PERMISSIONS.ANDROID.RECORD_AUDIO)
      .then((result) => {
        switch (result) {
          case RESULTS.UNAVAILABLE:
            console.log(
              'This feature is not available (on this device / in this context)',
            );
            break;
          case RESULTS.DENIED:
            console.log(
              'The permission has not been requested / is denied but requestable',
            );
            console.log("Requesting")
            request(PERMISSIONS.ANDROID.RECORD_AUDIO);
            break;
          case RESULTS.GRANTED:
            console.log('The permission is granted');
            break;
          case RESULTS.BLOCKED:
            console.log('The permission is denied and not requestable anymore');
            break;
        }
      })
      .catch((error) => {
        // …
      });


  }

  componentDidMount() {

    console.log("URI: " + RNBackgroundDownloader.directories.documents);

    TranscriptEvents = new NativeEventEmitter(Transcription);

    this.transcribeUnsubscribe1 = TranscriptEvents.addListener("onRecordingChange", res => {
      console.log("onRecordingChange event", res);
      var transcription = "";
      for(word in res.words){
        transcription = (transcription + res.words[word] + " ");
      }
      this.setState({ result: transcription});
    });
    this.transcribeUnsubscribe1 = TranscriptEvents.addListener("onRecordingCompletion", res => {
      console.log("onRecordingCompletion event", res);
      var transcription = "";
      for(word in res.words){
        transcription = (transcription + res.words[word] + " ");
      }
      this.setState({ result: transcription});
    });
  }

  startModelDownloads() {
    let modelTask = RNBackgroundDownloader.download({
      id: 'model',
      url: 'https://github.com/mozilla/DeepSpeech/releases/download/v0.8.0/deepspeech-0.8.0-models.tflite',
      destination: `${RNBackgroundDownloader.directories.documents}/deepspeech-0.8.0-models.tflite`
    }).begin((expectedBytes) => {
      console.log(`Going to download ${expectedBytes} bytes!`);
    }).progress((percent) => {
      console.log(`Downloaded: ${percent * 100}%`);
      this.setState({
        modelProgress: percent
      })
    }).done(() => {
      console.log('Download is done!');
      this.setState({
        modelProgress: 0
      })
    }).error((error) => {
      console.log('Download canceled due to error: ', error);
    });


    let scorerTask = RNBackgroundDownloader.download({
      id: 'scorer',
      url: 'https://github.com/mozilla/DeepSpeech/releases/download/v0.8.0/deepspeech-0.8.0-models.scorer',
      destination: `${RNBackgroundDownloader.directories.documents}/deepspeech-0.8.0-models.scorer`
    }).begin((expectedBytes) => {
      console.log(`Going to download ${expectedBytes} bytes!`);
    }).progress((percent) => {
      console.log(`Downloaded: ${percent * 100}%`);
      this.setState({
        scorerProgress: percent
      })
    }).done(() => {
      console.log('Download is done!');
      this.setState({
        scorerProgress: 0
      })
    }).error((error) => {
      console.log('Download canceled due to error: ', error);
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Result: {this.state.result}</Text>
        <Button title={"Start Recording"} onPress={() => 
          //Transcription.startRecordingFile(`${RNBackgroundDownloader.directories.documents}/deepspeech-0.8.0-models.tflite`, `${RNBackgroundDownloader.directories.documents}/deepspeech-0.8.0-models.scorer`, `${RNBackgroundDownloader.directories.documents}/test.pcm`, false)
          Transcription.startRecording(`${RNBackgroundDownloader.directories.documents}/test.aac`, `${RNBackgroundDownloader.directories.documents}/deepspeech-0.8.0-models.tflite`, `${RNBackgroundDownloader.directories.documents}/deepspeech-0.8.0-models.scorer`)
          } />
        <Button title={"Stop Recording"} onPress={() => Transcription.stopRecording(false)} />
        <Button title={"Download Model+Scorer"} onPress={() => this.startModelDownloads()} />
        <Progress.Bar progress={this.state.modelProgress} width={200} />
        <Progress.Bar progress={this.state.scorerProgress} width={200} />
      </View>
    );
  }
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
