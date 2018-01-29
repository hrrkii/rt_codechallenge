import React, { Component } from 'react';
import uuidv1 from 'uuid';
import './FormAppointment.css';

class FormAppointment extends Component {
    constructor(props) {
        super(props);
        this.state = {
            warnings: [],
            errors: [],
            dateClicked: props.dateClicked,
            appointmentClicked: props.appointmentClicked
        };
  
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.initializeForm = this.initializeForm.bind(this);
        this.setWarnings = this.setWarnings.bind(this);
    }

    componentWillReceiveProps(nextProps){
        // update form when date or event selected in parent
        this.setState({
            dateClicked: nextProps.dateClicked,
            appointmentClicked: nextProps.appointmentClicked,
            errors: []
        });

        const appointmentDate = nextProps.dateClicked ? nextProps.dateClicked : nextProps.appointmentClicked.start;
        const appointmentId = nextProps.appointmentClicked ? nextProps.appointmentClicked.id : null;
        this.initializeForm(nextProps.appointmentClicked);
        this.setWarnings(appointmentDate, appointmentId, this.props.existingAppointments);
    }

    initializeForm(appointmentClicked){
        if(appointmentClicked){
            const {title, start, end} = appointmentClicked;
            this.setState({
                title: title,
                hour: start.getHours() > 12 ? start.getHours() - 12 : start.getHours() === 0 ? 12 : start.getHours(),
                minute: start.getMinutes(),
                ampm: start.getHours() < 12 ? 'am' : 'pm',
                duration: (end - start) / 60000
            });
        } else {
            this.setState({
                title: '',
                hour: '8',
                minute: '00',
                ampm: 'am',
                duration: '60'
            });
        }
    }

    setWarnings(appointmentDate, appointmentId, existingAppointments){
        // need to look through existing appointments to see if any existing ones for this date.
        let appointmentsSameDay = [];
        let warnings = [];

        for(const i in existingAppointments){
            if(appointmentId !== existingAppointments[i].id){
                const existingStart = existingAppointments[i].start;
                if(appointmentDate.getFullYear() === existingStart.getFullYear()
                    && appointmentDate.getMonth() === existingStart.getMonth()
                    && appointmentDate.getDate() === existingStart.getDate()) {
                        appointmentsSameDay.push(existingAppointments[i]);
                    }
            }
        }

        if(appointmentsSameDay.length > 0){
            let warning = appointmentsSameDay.length === 1 ? 
                'There is already an appointment for this day: ' :
                'There are already appointments for this day: '
            warning += appointmentsSameDay.map(apt => {
                const makeTimeString = date => {
                    let hour = date.getHours();
                    const minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
                    const ampm = hour < 12 ? 'am' : 'pm';
                    if (hour === 0) {
                        hour = 12;
                    } else if(hour > 12) {
                        hour -= 12;
                    }

                    return `${hour}:${minutes}${ampm}`;
                };

                return `${apt.title} (${makeTimeString(apt.start)} - ${makeTimeString(apt.end)})`;
            }).join();

            warnings.push(warning);
        }

        this.setState({warnings});
    }
  
    handleChange(event) {
        const {name, value} = event.target
        this.setState({[name]: value});
    }
  
    handleSubmit(event) {
        // create/edit appointment
        const {title, hour, minute, ampm, duration, dateClicked, appointmentClicked} = this.state;
        const action = dateClicked ? 'add' : 'edit';
        const date = action === 'add' ? dateClicked : appointmentClicked.start;
        const start = this.createAppointmentStart(date, hour, minute, ampm);
        const end = this.createAppointmentEnd(start, duration);
        const appointment = {
            id: appointmentClicked ? appointmentClicked.id : uuidv1(),
            title,
            start,
            end
        }

        // handling this all internallh, so don't subimt the form
        event.preventDefault();
        
        // make sure its a valid appointment
        const errors = this.validateAppointment(appointment, this.props.existingAppointments);
        if(errors.length > 0) {
            // keep showing for with errors
            this.setState({errors});
        } else {
            // submit the changes
            this.props.onAppointmentChange(appointment, action);
        }
    }

    handleDelete(event){
        event.preventDefault();
        this.props.onAppointmentChange(this.state.appointmentClicked, 'delete');
    }

    createAppointmentStart(date, hour, minute, ampm){
        hour = Number(hour);
        minute = Number(minute);

        let start = new Date(date.getTime());

        // set hour so 12's and pm situations correctly reflected
        if(hour === 12) {
            if (ampm === 'am') {
                hour = 0;
            } 
        } else if(ampm === 'pm') {
            hour += 12;
        }
        start.setHours(hour, minute, 0, 0);
        
        return start;
    }

    createAppointmentEnd(start, duration){
        duration = Number(duration);
        return new Date(start.getTime() + duration*60000);
    }

    validateAppointment(appointment, existingAppointments){
        let errors = [];

        if(!this.validateAppointmentTitleLength(appointment)){
            errors.push('You must add a title for your appointment.')
        }

        if(!this.validateAppointmentEndDate(appointment)){
            errors.push('Your appointment cannot extend into the next day.')
        }

        if(!this.validateAppointmentAgainstExisting(appointment, existingAppointments)){
            errors.push('Your appointment cannot overlap with an existing one.')
        }

        return errors;
    }

    validateAppointmentTitleLength(appointment){
        // appointment must have a title
        return appointment.title.length > 0;
    }

    validateAppointmentEndDate(appointment){
        // appointment cannot span across days
        return appointment.start.getDay() === appointment.end.getDay();
    }

    validateAppointmentAgainstExisting(appointment, existingAppointments){
        // new appointment cannot overlap with existing appointment
        if(existingAppointments.length > 0){
            const startTime = appointment.start.getTime();
            const endTime = appointment.end.getTime();

            for(const i in existingAppointments){
                // make sure we aren't comparing to self in the case of an edit
                if(appointment.id !== existingAppointments[i].id){
                    const existingStartTime = existingAppointments[i].start.getTime();
                    const existingEndTime = existingAppointments[i].end.getTime();
    
                    // make sure neither start time in the range of the other
                    if ((startTime >= existingStartTime && startTime < existingEndTime) ||
                        (existingStartTime >= startTime && existingStartTime < endTime)) {
                            return false;
                        }
                }
            }
        }
        
        // no overlaps found
        return true;
    }
  
    render() {
        return (
            <form onSubmit={this.handleSubmit} className='FormAppointment'>
                <h2>
                    {this.state.dateClicked && `Create Appointment for ${this.state.dateClicked.toLocaleDateString()}`}
                    {this.state.appointmentClicked && `Editing ${this.state.appointmentClicked.title} on ${this.state.appointmentClicked.start.toLocaleDateString()}`}
                </h2>
                {this.state.warnings.length > 0 &&
                    this.state.warnings.map((warning, index) => {return <p key={index} className='warning'>{warning}</p>})
                }
                {this.state.errors.length > 0 &&
                    <ul className='errors'>
                        {this.state.errors.map((error, index) => {return <li key={index}>{error}</li>})}
                    </ul>
                }
                <section>
                    <p>
                        <label>Title:</label>
                        <input name="title" type="text" value={this.state.title} onChange={this.handleChange} />
                    </p>
                    <p>
                        <label>Start time:</label>
                        <select name="hour" value={this.state.hour} onChange={this.handleChange}>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                            <option value="11">11</option>
                            <option value="12">12</option>
                        </select>
                        :
                        <select name="minute" value={this.state.minute} onChange={this.handleChange}>
                            <option value="00">00</option>
                            <option value="15">15</option>
                            <option value="30">30</option>
                            <option value="45">45</option>
                        </select>
                        <select name="ampm" value={this.state.ampm} onChange={this.handleChange}>
                            <option value="am">am</option>
                            <option value="pm">pm</option>
                        </select>
                    </p>
                    <p>
                        <label>Duration:</label>
                        <select name="duration" value={this.state.duration} onChange={this.handleChange}>
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="90">1.5 hours</option>
                            <option value="120">2 hours</option>
                        </select>
                    </p>
                    <p>
                        <label>
                            {this.state.appointmentClicked &&
                                <a href="deleteAppointment" onClick={this.handleDelete}>delete appointment</a>
                            }
                        </label>
                        <input type="submit" value="Save Appointment" />
                    </p>
                </section>
            </form>
        );
    }
}

export default FormAppointment;