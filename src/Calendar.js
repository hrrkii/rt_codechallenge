import React, { Component } from 'react';
import SkyLight from 'react-skylight';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import FormAppointment from './FormAppointment';

BigCalendar.momentLocalizer(moment); 

class Calendar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            appointments: [
                // uncomment this appointment to seed calendar with a past one
                // {
                //     id: 1,
                //     title: 'Past Event',
                //     start: new Date(2018, 0, 7, 10),
                //     end: new Date(2018, 0, 7, 11),
                // }
            ],
            dateClicked: null,
            appointmentClicked: null
        };

        this.slotSelectHandler = this.slotSelectHandler.bind(this);
        this.eventSelectHander = this.eventSelectHander.bind(this);
        this.appointmentChangeHandler = this.appointmentChangeHandler.bind(this);
    }

    // handler for selecting a day - allow to add a new event
    slotSelectHandler = slotInfo => {
        
        // only want to deal with clicks for this app since events cannot span days
        if(slotInfo.action === 'click') {

            // don't want to allow if day is in the past
            const today = this.getToday();
            const dateClicked = slotInfo.start;
            if(dateClicked >= today) {
                // update the current state and show the form
                this.setState({
                    dateClicked: dateClicked,
                    appointmentClicked: null
                });
                this.formDialog.show();
            } else {
                this.pastDialog.show();
            }
        }
    }

    // handler for selecting an appointment - allow to edit or delete it
    eventSelectHander = appointmentClicked => {
        // don't want to allow if appointment is in the past
        const today = this.getToday();
        if(appointmentClicked.start >= today){
            // update the current state and show the form
            this.setState({
                dateClicked: null,
                appointmentClicked: appointmentClicked
            });
            this.formDialog.show();
        } else {
            this.pastDialog.show();
        }
    }

    appointmentChangeHandler(appointment, changeType){
        
        if(changeType === 'add'){
            // add new appointment
            this.setState({
                appointments: [...this.state.appointments, appointment]
            });
        } else if(changeType === 'edit') {
            // find and replace the edited appointment
            let updatedAppointments = [];
            for(const i in this.state.appointments){
                if(this.state.appointments[i].id === appointment.id) {
                    updatedAppointments.push(appointment);
                } else {
                    updatedAppointments.push(this.state.appointments[i]);
                }
            }
            this.setState({
                appointments: updatedAppointments
            });
        } else if(changeType === 'delete'){
            // find and remove the deleted appointment
            let updatedAppointments = [];
            for(const i in this.state.appointments){
                if(this.state.appointments[i].id !== appointment.id) {
                    updatedAppointments.push(this.state.appointments[i]);
                }
            }
            this.setState({
                appointments: updatedAppointments
            });
        }

        this.formDialog.hide();
    }

    getToday(){
        let today = new Date();
        today.setHours(0,0,0,0);  // need to trim to we can match current day being selected

        return today;
    }

    render() {
        // console.log(events);
        console.log(this.state.appointments);
        return (
            <div className="Calendar">
                <BigCalendar
                    events={this.state.appointments}
                    views={['month']}
                    toolbar={true}
                    popup
                    selectable
                    onSelectSlot={this.slotSelectHandler}
                    onSelectEvent={this.eventSelectHander}
                />
                <SkyLight 
                    hideOnOverlayClicked 
                    ref={ref => this.formDialog = ref} 
                    title={false}
                    dialogStyles={{height: '250px'}}>
                    <FormAppointment 
                        ref={ref => this.appointmentForm = ref}
                        dateClicked={this.state.dateClicked}
                        appointmentClicked={this.state.appointmentClicked}
                        existingAppointments={this.state.appointments}
                        onAppointmentChange={this.appointmentChangeHandler}
                    />
                </SkyLight>
                <SkyLight 
                    hideOnOverlayClicked 
                    ref={ref => this.pastDialog = ref} 
                    title="Past Date"
                    dialogStyles={{height: '140px'}}>
                    <p>Making or adjusting appointments in the past is not allowed. 
                        Try selecting today or a date in the future</p>
                </SkyLight>
            </div>
        )
    }
}  

export default Calendar;