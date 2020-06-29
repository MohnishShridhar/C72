import React from 'react';
import {Text, View, StyleSheet, Image, KeyboardAvoidingView, ToastAndroid } from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarcodeScanner} from 'expo-barcode-scanner'
import { TouchableOpacity, TextInput } from 'react-native-gesture-handler';
import firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions:null,
            scanned:false,
            scannedBookId:'',
            scannedStudentId:'',
            buttonState:'normal',
            transactionMessage:''
        }
    }

    getCameraPermissions=async(id)=>{
        const {status}= await Permissions.askAsync(Permissions.CAMERA);

        this.setState({
            hasCameraPermissions:status==="granted",
            buttonState:id,
            scanned:false
        })
    }

    handleBarcodeScanned =async({type, data})=>{
        const {buttonState}=this.state
        
        if(buttonState==="BookId"){
          this.setState({
            scanned:true,
            scannedBookId:data,
            buttonState:'normal'
          })  
        } else if(buttonState==="StudentId"){
            this.setState({
              scanned:true,
              scannedStudentId:data,
              buttonState:'normal'
            })  
          }
        
    }

    initiateBookIssue=async()=>{
        //add transaction
        db.collection("transactions").add({
            'studentId':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':"issue"
        })
        //change book status
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':false
        })
        //change the number of books issued per student
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(1)
        })
        this.setState({
            scannedStudentId:'',
            scannedBookId:''
        })
    }

    initiateBookReturn=async()=>{
        //add transaction
        db.collection("transactions").add({
            'studentId':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':"return"
        })
        //change book status
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':true
        })
        //change the number of books issued per student
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(-1)
        })
        this.setState({
            scannedStudentId:'',
            scannedBookId:''
        })
    }

    handleTransaction=async()=>{
        var transactionMessage=null;
        db.collection("books").doc(this.state.scannedBookId).get()
        .then((doc)=>{
            var book=doc.data()
            if(book.bookAvailability){
                this.initiateBookIssue();
                transactionMessage="Book issued"
                alert(transactionMessage)
                //ToastAndroid.show(transactionMessage, ToastAndroid.SHORT);
            } else {
                this.initiateBookReturn();
                transactionMessage="Book returned"
                alert(transactionMessage)
                //ToastAndroid.show(transactionMessage, ToastAndroid.SHORT);
            }
        })
        this.setState({
            transactionMessage:transactionMessage
        })
    }

    render(){
        const hasCameraPermissions= this.state.hasCameraPermissions;
        const scanned = this.state.scanned;
        const buttonState=this.state.buttonState
        
        if(buttonState!=="normal" && hasCameraPermissions){
            return(
                <BarcodeScanner
                onBarcodeScanned={scanned? undefined:this.handleBarcodeScanned}
                style={StyleSheet.absoluteFillObject}
                />
            )
        } else if(buttonState==="normal"){
            return(
                <KeyboardAvoidingView style= {styles.container} behavior="padding" enable>
                    <View>
                        <Image
                        source={require("../assets/booklogo.jpg")}
                        style={{width:200, height:200}}
                        />

                        <Text style={{textAlign:'center', fontSize:30}}>WiLy</Text>
                    </View>
                    <View style={styles.inputView}>
                        <TextInput
                        style={styles.inputBox}
                        placeholder= "Book ID"
                        onChangeText={text=>this.setState({scannedBookId:text})}
                        value={this.state.scannedBookId}/>

                        <TouchableOpacity
                        style={styles.scanButton}
                        onPress={()=>{
                            this.getCameraPermissions("BookId")
                        }}>
                            <Text style={styles.buttonText}
                            >Scan</Text>
                        </TouchableOpacity>

                    </View>

                    <View style={styles.inputView}>
                        <TextInput
                        style={styles.inputBox}
                        placeholder= "Student ID"
                        onChangeText={text=>this.setState({scannedStudentId:text})}
                        value={this.state.scannedStudentId}/>

                        <TouchableOpacity
                        style={styles.scanButton}
                        onPress={()=>{
                            this.getCameraPermissions("StudentId")
                        }}>
                            <Text style={styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.transactionAlert}>{this.state.transactionMessage}</Text>
                    <TouchableOpacity
                    style={styles.submitButton}
                    onPress={async()=>{
                        var transactionMessage= await this.handleTransaction();
                        //this.setState(
                          //  {
                            //    scannedBookId:'',
                              //  scannedStudentId:''
                            //}
                        //)
                    }}>
                        <Text style={styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            )
        }
    }
}

const styles=StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },
    displayText:{
        fontSize:15,
        textDecorationLine:'underline'
    },
    scanButton:{
        backgroundColor:'#66bb6a',
        width:50,
        borderWidth:1.5,
        borderLeftWidth:0,
        padding:10,
        margin:10
    },
    buttonText:{
        fontSize:15,
        textAlign:'center',
        marginTop:10
    },
    inputView:{
        flexDirection:'row',
        margin:20
    },
    inputBox:{
        width:200,
        height:40,
        borderWidth:1.5,
        borderRightWidth:0,
        fontSize:20
    },
    submitButton:{
        backgroundColor:'#fbc02d',
        width:100,
        height:50
    },
    submitButtonText:{
        padding:10,
        textAlign:'center',
        fontSize:20,
        fontWeight:"bold",
        color:'white'
    }
})