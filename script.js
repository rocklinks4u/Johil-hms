/* ==================== HOSPITAL MANAGEMENT SYSTEM - JAVASCRIPT ==================== */

// ==================== DATA MANAGEMENT ==================== 
class HospitalManagementSystem {
    constructor() {
        this.patients = [];
        this.vitalSigns = [];
        this.nextFolderNumber = 1;
        this.firebaseApp = null;
        this.database = null;
    }

    // Initialize the system
    init() {
        this.patients = this.loadFromStorage('patients') || [];
        this.vitalSigns = this.loadFromStorage('vitalSigns') || [];
        this.nextFolderNumber = this.loadFromStorage('nextFolderNumber') || 1;
        
        this.setupEventListeners();
        this.setupFirebase();
        this.updateDateTime();
        this.updateDashboard();
        this.setTodayDate();
        this.updateGeneratedFolderNumber();
        this.toggleNHISFields();
        setInterval(() => this.updateDateTime(), 1000);
    }

    setupFirebase() {
    }

    folderKey(folderNumber) {
        return folderNumber.replace(/\//g, '-');
    }

    async allocateFolderNumber() {
        // For now, use local storage instead of Firebase
        const year = new Date().getFullYear();
        const allocatedNumber = this.nextFolderNumber;
        this.nextFolderNumber++;
        this.saveToStorage('nextFolderNumber', this.nextFolderNumber);
        this.updateGeneratedFolderNumber();
        return `${year}/${String(allocatedNumber).padStart(3, '0')}`;
    }

    // ==================== STORAGE ==================== 
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`hms_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(`hms_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    // ==================== DATE & TIME ==================== 
    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        const el = document.getElementById('currentDateTime');
        if (!el) return;
        el.textContent = now.toLocaleString('en-US', options);
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('registrationDate');
        if (dateInput) {
            dateInput.value = today;
        }
    }

    // ==================== FOLDER NUMBER GENERATION ==================== 
    generateFolderNumber() {
        const year = new Date().getFullYear();
        const folderNumber = `${year}/${String(this.nextFolderNumber).padStart(3, '0')}`;
        this.nextFolderNumber++;
        this.saveToStorage('nextFolderNumber', this.nextFolderNumber);
        return folderNumber;
    }

    updateGeneratedFolderNumber() {
        const year = new Date().getFullYear();
        const nextNumber = String(this.nextFolderNumber).padStart(3, '0');
        document.getElementById('generatedFolderNumber').textContent = `${year}/${nextNumber}`;
    }

    // ==================== PATIENT REGISTRATION ==================== 
    async savePatient(e) {
        e.preventDefault();

        const patientStatus = document.querySelector('input[name="patientStatus"]:checked')?.value;
        const patientCategory = document.querySelector('input[name="patientCategory"]:checked')?.value;
        const nhisStatus = document.querySelector('input[name="nhisStatus"]:checked')?.value;

        if (!patientStatus || !patientCategory || !nhisStatus) {
            this.showNotification('Please complete the required patient status fields', 'error');
            return;
        }

        const folderNumber = await this.allocateFolderNumber();
        const formData = {
            folderNumber,
            registrationDate: document.getElementById('registrationDate').value,
            fullName: document.getElementById('fullName').value,
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            patientStatus,
            patientCategory,
            nhisStatus,
            nhisNumber: document.getElementById('nhisNumber').value,
            insuranceProvider: document.getElementById('insuranceProvider').value,
            createdAt: new Date().toISOString()
        };

        // Save to local storage for now
        this.patients.push(formData);
        this.saveToStorage('patients', this.patients);

        this.showNotification('Patient registered successfully!', 'success');
        document.getElementById('patientForm').reset();
        this.setTodayDate();
        document.getElementById('editingFolderNumber').value = '';
        this.updateGeneratedFolderNumber();
        this.toggleNHISFields();
        this.updateDashboard();
    }

    // ==================== UPDATE PATIENT ==================== 
    async updatePatient() {
        const folderNumber = document.getElementById('editingFolderNumber').value;
        const fullName = document.getElementById('fullName').value;

        if (!fullName) {
            this.showNotification('Please enter patient name to update', 'error');
            return;
        }

        if (!folderNumber) {
            this.showNotification('Please load a patient before updating', 'error');
            return;
        }

        const patientIndex = this.patients.findIndex(p => p.folderNumber === folderNumber);
        if (patientIndex === -1) {
            this.showNotification('Patient not found', 'error');
            return;
        }

        const patientStatus = document.querySelector('input[name="patientStatus"]:checked')?.value;
        const patientCategory = document.querySelector('input[name="patientCategory"]:checked')?.value;
        const nhisStatus = document.querySelector('input[name="nhisStatus"]:checked')?.value;

        if (!patientStatus || !patientCategory || !nhisStatus) {
            this.showNotification('Please complete the required patient status fields', 'error');
            return;
        }

        const updatedPatient = {
            ...this.patients[patientIndex],
            registrationDate: document.getElementById('registrationDate').value,
            fullName,
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            patientStatus,
            patientCategory,
            nhisStatus,
            nhisNumber: document.getElementById('nhisNumber').value,
            insuranceProvider: document.getElementById('insuranceProvider').value,
            updatedAt: new Date().toISOString()
        };

        this.patients[patientIndex] = updatedPatient;
        this.saveToStorage('patients', this.patients);
        this.showNotification('Patient updated successfully!', 'success');
        document.getElementById('patientForm').reset();
        document.getElementById('editingFolderNumber').value = '';
        this.setTodayDate();
        this.toggleNHISFields();
        this.updateDashboard();
    }

    // ==================== DELETE PATIENT ==================== 
    async deletePatient() {
        const folderNumber = document.getElementById('editingFolderNumber').value;
        const fullName = document.getElementById('fullName').value;

        if (!fullName) {
            this.showNotification('Please enter patient name to delete', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this patient?')) {
            return;
        }

        if (!folderNumber) {
            this.showNotification('Please load a patient before deleting', 'error');
            return;
        }

        const patientIndex = this.patients.findIndex(p => p.folderNumber === folderNumber);
        if (patientIndex === -1) {
            this.showNotification('Patient not found', 'error');
            return;
        }

        this.patients.splice(patientIndex, 1);
        this.saveToStorage('patients', this.patients);
        this.showNotification('Patient deleted successfully!', 'success');
        document.getElementById('patientForm').reset();
        document.getElementById('editingFolderNumber').value = '';
        this.toggleNHISFields();
        this.updateDashboard();
    }

    // ==================== VITAL SIGNS ==================== 
    async saveVitalSigns(e) {
        e.preventDefault();

        const fullName = document.getElementById('vitalPatientName').value.trim();
        if (!fullName) {
            this.showNotification('Please enter the patient name for vital signs', 'error');
            return;
        }

        const patient = this.patients.find(p => p.fullName.toLowerCase() === fullName.toLowerCase());
        if (!patient) {
            this.showNotification('Patient not found in records. Please check the name.', 'error');
            return;
        }

        const vitalSignsData = {
            folderNumber: patient.folderNumber,
            patientName: patient.fullName,
            date: new Date().toISOString(),
            temperature: document.getElementById('temperature').value,
            bloodPressure: document.getElementById('bloodPressure').value,
            pulseRate: document.getElementById('pulseRate').value,
            respiratoryRate: document.getElementById('respiratoryRate').value,
            weight: document.getElementById('weight').value,
            height: document.getElementById('height').value,
            oxygenSaturation: document.getElementById('oxygenSaturation').value
        };

        // Save to local storage for now
        this.vitalSigns.push(vitalSignsData);
        this.saveToStorage('vitalSigns', this.vitalSigns);
        this.showNotification('Vital signs saved successfully!', 'success');
        document.getElementById('vitalSignsForm').reset();
        this.updateRecordTables();
    }

    // ==================== DASHBOARD STATISTICS ==================== 
    updateDashboard() {
        const totalPatients = this.patients.length;
        const outpatients = this.patients.filter(p => p.patientCategory === 'Outpatient').length;
        const inpatients = this.patients.filter(p => p.patientCategory === 'Inpatient').length;
        const nhisPatients = this.patients.filter(p => p.nhisStatus === 'Yes').length;
        const cashPatients = this.patients.filter(p => p.nhisStatus === 'No').length;

        document.getElementById('statTotalPatients').textContent = totalPatients;
        document.getElementById('statOutpatients').textContent = outpatients;
        document.getElementById('statInpatients').textContent = inpatients;
        document.getElementById('statNHIS').textContent = nhisPatients;
        document.getElementById('statCash').textContent = cashPatients;

        this.updateRecentPatients();
        this.updateRecordTables();
        this.updateReports();
    }

    updateRecentPatients() {
        const recent = this.patients.slice(-5).reverse();
        const tbody = document.querySelector('#recentPatientsTable tbody');
        tbody.innerHTML = '';

        if (recent.length === 0) {
            document.getElementById('recentEmptyMessage').style.display = 'block';
            return;
        }

        document.getElementById('recentEmptyMessage').style.display = 'none';

        recent.forEach(patient => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${patient.folderNumber}</td>
                <td>${patient.fullName}</td>
                <td>${patient.patientCategory}</td>
                <td><span class="status-badge ${patient.nhisStatus === 'Yes' ? 'status-nhis' : 'status-cash'}">
                    ${patient.nhisStatus === 'Yes' ? 'NHIS' : 'Cash'}</span></td>
                <td>${this.formatDate(patient.registrationDate)}</td>
            `;
        });
    }

    updateReports() {
        const maleCount = this.patients.filter(p => p.gender === 'Male').length;
        const femaleCount = this.patients.filter(p => p.gender === 'Female').length;
        const newPatients = this.patients.filter(p => p.patientStatus === 'New').length;
        const oldPatients = this.patients.filter(p => p.patientStatus === 'Old').length;
        const outpatients = this.patients.filter(p => p.patientCategory === 'Outpatient').length;
        const inpatients = this.patients.filter(p => p.patientCategory === 'Inpatient').length;
        const nhisPatients = this.patients.filter(p => p.nhisStatus === 'Yes').length;
        const cashPatients = this.patients.filter(p => p.nhisStatus === 'No').length;

        document.getElementById('reportMale').textContent = maleCount;
        document.getElementById('reportFemale').textContent = femaleCount;
        document.getElementById('reportNew').textContent = newPatients;
        document.getElementById('reportOld').textContent = oldPatients;
        document.getElementById('reportOutpatients').textContent = outpatients;
        document.getElementById('reportInpatients').textContent = inpatients;
        document.getElementById('reportNHIS').textContent = nhisPatients;
        document.getElementById('reportCash').textContent = cashPatients;
    }

    // ==================== RECORD TABLES ==================== 
    updateRecordTables() {
        this.populateOutpatients();
        this.populateInpatients();
        this.populateAllRecords();
        this.populateVitalSignsTable();
    }

    populateOutpatients() {
        const outpatients = this.patients.filter(p => p.patientCategory === 'Outpatient');
        const tbody = document.querySelector('#outpatientsTable tbody');
        tbody.innerHTML = '';

        if (outpatients.length === 0) {
            document.getElementById('outpatientsEmptyMessage').style.display = 'block';
            return;
        }

        document.getElementById('outpatientsEmptyMessage').style.display = 'none';

        outpatients.forEach(patient => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${patient.folderNumber}</td>
                <td>${this.formatDate(patient.registrationDate)}</td>
                <td>${patient.fullName}</td>
                <td>${patient.age}</td>
                <td>${patient.gender}</td>
                <td><span class="status-badge ${patient.nhisStatus === 'Yes' ? 'status-nhis' : 'status-cash'}">
                    ${patient.nhisStatus === 'Yes' ? 'NHIS' : 'Cash'}</span></td>
                <td>${patient.phone}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="hms.editPatient('${patient.folderNumber}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn view" onclick="hms.viewPatientDetails('${patient.folderNumber}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            `;
        });
    }

    populateInpatients() {
        const inpatients = this.patients.filter(p => p.patientCategory === 'Inpatient');
        const tbody = document.querySelector('#inpatientsTable tbody');
        tbody.innerHTML = '';

        if (inpatients.length === 0) {
            document.getElementById('inpatientsEmptyMessage').style.display = 'block';
            return;
        }

        document.getElementById('inpatientsEmptyMessage').style.display = 'none';

        inpatients.forEach(patient => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${patient.folderNumber}</td>
                <td>${this.formatDate(patient.registrationDate)}</td>
                <td>${patient.fullName}</td>
                <td>${patient.age}</td>
                <td>${patient.gender}</td>
                <td><span class="status-badge ${patient.nhisStatus === 'Yes' ? 'status-nhis' : 'status-cash'}">
                    ${patient.nhisStatus === 'Yes' ? 'NHIS' : 'Cash'}</span></td>
                <td>${patient.phone}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="hms.editPatient('${patient.folderNumber}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn view" onclick="hms.viewPatientDetails('${patient.folderNumber}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            `;
        });
    }

    populateAllRecords() {
        const tbody = document.querySelector('#allRecordsTable tbody');
        tbody.innerHTML = '';

        if (this.patients.length === 0) {
            document.getElementById('recordsEmptyMessage').style.display = 'block';
            return;
        }

        document.getElementById('recordsEmptyMessage').style.display = 'none';

        this.patients.forEach(patient => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${patient.folderNumber}</td>
                <td>${this.formatDate(patient.registrationDate)}</td>
                <td>${patient.fullName}</td>
                <td>${patient.patientCategory}</td>
                <td><span class="status-badge ${patient.nhisStatus === 'Yes' ? 'status-nhis' : 'status-cash'}">
                    ${patient.nhisStatus === 'Yes' ? 'NHIS' : 'Cash'}</span></td>
                <td>${patient.phone}</td>
                <td><span class="status-badge status-active">${patient.patientStatus}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="hms.editPatient('${patient.folderNumber}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn view" onclick="hms.viewPatientDetails('${patient.folderNumber}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            `;
        });
    }

    populateVitalSignsTable() {
        const tbody = document.querySelector('#vitalSignsTable tbody');
        tbody.innerHTML = '';

        if (this.vitalSigns.length === 0) {
            document.getElementById('vitalSignsEmptyMessage').style.display = 'block';
            return;
        }

        document.getElementById('vitalSignsEmptyMessage').style.display = 'none';

        this.vitalSigns.forEach((vital, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${vital.folderNumber}</td>
                <td>${vital.patientName}</td>
                <td>${this.formatDateTime(vital.date)}</td>
                <td>${vital.temperature || '-'}</td>
                <td>${vital.bloodPressure || '-'}</td>
                <td>${vital.pulseRate || '-'}</td>
                <td>${vital.respiratoryRate || '-'}</td>
                <td>${vital.weight || '-'}</td>
                <td>${vital.height || '-'}</td>
                <td>${vital.oxygenSaturation || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn delete" onclick="hms.deleteVitalSign(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
        });
    }

    editPatient(folderNumber) {
        const patient = this.patients.find(p => p.folderNumber === folderNumber);
        if (!patient) return;

        document.getElementById('registrationDate').value = patient.registrationDate;
        document.getElementById('fullName').value = patient.fullName;
        document.getElementById('age').value = patient.age;
        document.getElementById('gender').value = patient.gender;
        document.getElementById('phone').value = patient.phone;
        document.getElementById('address').value = patient.address;

        document.querySelector(`input[name="patientStatus"][value="${patient.patientStatus}"]`).checked = true;
        document.querySelector(`input[name="patientCategory"][value="${patient.patientCategory}"]`).checked = true;
        document.querySelector(`input[name="nhisStatus"][value="${patient.nhisStatus}"]`).checked = true;

        document.getElementById('nhisNumber').value = patient.nhisNumber;
        document.getElementById('insuranceProvider').value = patient.insuranceProvider;
        document.getElementById('editingFolderNumber').value = patient.folderNumber;

        this.toggleNHISFields();
        this.switchSection('patient-registration');
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        const regMenuItem = document.querySelector('.menu-item[data-section="patient-registration"]');
        if (regMenuItem) regMenuItem.classList.add('active');

        // Scroll to form
        document.getElementById('patient-registration').scrollIntoView({ behavior: 'smooth' });
        this.showNotification('Patient loaded for editing', 'info');
    }

    viewPatientDetails(folderNumber) {
        const patient = this.patients.find(p => p.folderNumber === folderNumber);
        if (!patient) return;

        let details = `Folder Number: ${patient.folderNumber}\n`
            + `Name: ${patient.fullName}\n`
            + `Age: ${patient.age}\n`
            + `Gender: ${patient.gender}\n`
            + `Phone: ${patient.phone}\n`
            + `Address: ${patient.address}\n`
            + `Type: ${patient.patientCategory}\n`
            + `Status: ${patient.patientStatus} Patient\n`
            + `NHIS: ${patient.nhisStatus}`;

        if (patient.nhisStatus === 'Yes') {
            details += `\nNHIS Number: ${patient.nhisNumber}`;
            details += `\nInsurance Provider: ${patient.insuranceProvider}`;
        }

        alert(details);
    }

    deleteVitalSign(index) {
        if (confirm('Delete this vital signs record?')) {
            this.vitalSigns.splice(index, 1);
            this.saveToStorage('vitalSigns', this.vitalSigns);
            this.populateVitalSignsTable();
            this.showNotification('Vital signs record deleted', 'success');
        }
    }

    // ==================== SEARCH & FILTER ==================== 
    searchPatients(searchTerm, tableType) {
        const rows = document.querySelectorAll(`#${tableType}Table tbody tr`);
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    searchVitalSigns(searchTerm) {
        const rows = document.querySelectorAll('#vitalSignsTable tbody tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    filterRecords() {
        const typeFilter = document.getElementById('recordFilterType').value;
        const nhisFilter = document.getElementById('recordFilterNHIS').value;
        const rows = document.querySelectorAll('#allRecordsTable tbody tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const type = cells[3].textContent;
            const nhis = cells[4].textContent;

            let show = true;

            if (typeFilter && !type.includes(typeFilter)) show = false;
            if (nhisFilter === 'Yes' && !nhis.includes('NHIS')) show = false;
            if (nhisFilter === 'No' && !nhis.includes('Cash')) show = false;

            row.style.display = show ? '' : 'none';
        });
    }

    // ==================== NHIS TOGGLE ==================== 
    toggleNHISFields() {
        const selected = document.querySelector('input[name="nhisStatus"]:checked');
        const nhisYes = selected?.value === 'Yes';
        if (!selected) {
            document.getElementById('nhisDetails').classList.remove('show');
            document.getElementById('cashPatientNote').classList.remove('show');
            return;
        }
        document.getElementById('nhisDetails').classList.toggle('show', nhisYes);
        document.getElementById('cashPatientNote').classList.toggle('show', !nhisYes);
    }

    // ==================== PRINT FUNCTION ==================== 
    printPatientRecord() {
        const fullName = document.getElementById('fullName').value;
        if (!fullName) {
            this.showNotification('Please select a patient to print', 'error');
            return;
        }

        window.print();
    }

    // ==================== EXPORT DATA ==================== 
    exportAllData() {
        const data = {
            patients: this.patients,
            vitalSigns: this.vitalSigns,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `HMS-Export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showNotification('Data exported successfully!', 'success');
    }

    importData() {
        document.getElementById('importFileInput').click();
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                this.patients = data.patients || [];
                this.vitalSigns = data.vitalSigns || [];
                this.saveToStorage('patients', this.patients);
                this.saveToStorage('vitalSigns', this.vitalSigns);
                this.updateDashboard();
                this.showNotification('Data imported successfully!', 'success');
            } catch (error) {
                this.showNotification('Error importing data', 'error');
            }
        };
        reader.readAsText(file);
    }

    async clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
            // Clear local storage
            this.patients = [];
            this.vitalSigns = [];
            this.nextFolderNumber = 1;
            this.saveToStorage('patients', this.patients);
            this.saveToStorage('vitalSigns', this.vitalSigns);
            this.saveToStorage('nextFolderNumber', this.nextFolderNumber);
            this.updateDashboard();
            this.updateGeneratedFolderNumber();
            this.showNotification('All data has been cleared', 'success');
        }
    }

    exportTableData(tableType) {
        let data = [];
        let filename = 'export';

        if (tableType === 'outpatients') {
            data = this.patients.filter(p => p.patientCategory === 'Outpatient');
            filename = 'Outpatients';
        } else if (tableType === 'inpatients') {
            data = this.patients.filter(p => p.patientCategory === 'Inpatient');
            filename = 'Inpatients';
        } else if (tableType === 'records') {
            data = this.patients;
            filename = 'Patient-Records';
        }

        const csv = this.convertToCSV(data);
        this.downloadCSV(csv, `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
        this.showNotification('Data exported successfully!', 'success');
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header =>
                    JSON.stringify(row[header] || '')
                ).join(',')
            )
        ];

        return csv.join('\n');
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
    }

    // ==================== NOTIFICATIONS ==================== 
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ==================== UTILITIES ==================== 
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ==================== NAVIGATION ==================== 
    setupEventListeners() {
        const on = (id, event, handler) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, handler);
        };

        // Section navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const sectionId = item.getAttribute('data-section');
                this.switchSection(sectionId);
                document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
                item.classList.add('active');
                if (window.innerWidth <= 768) {
                    document.querySelector('.sidebar').classList.remove('show');
                }
                return false;
            });
        });

        // Form events
        on('patientForm', 'submit', (e) => this.savePatient(e));
        on('updateBtn', 'click', () => this.updatePatient());
        on('deleteBtn', 'click', () => this.deletePatient());
        on('printBtn', 'click', () => this.printPatientRecord());

        // Vital signs form
        on('vitalSignsForm', 'submit', (e) => this.saveVitalSigns(e));

        // NHIS toggle
        document.querySelectorAll('input[name="nhisStatus"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleNHISFields());
        });

        // Search functions
        on('recordSearchInput', 'input', (e) => {
            this.searchPatients(e.target.value, 'allRecords');
        });

        on('outpatientSearchInput', 'input', (e) => {
            this.searchPatients(e.target.value, 'outpatients');
        });

        on('inpatientSearchInput', 'input', (e) => {
            this.searchPatients(e.target.value, 'inpatients');
        });

        on('vitalSearchInput', 'input', (e) => {
            this.searchVitalSigns(e.target.value);
        });

        // Filter functions
        on('recordFilterType', 'change', () => this.filterRecords());
        on('recordFilterNHIS', 'change', () => this.filterRecords());

        // Export buttons
        on('exportRecords', 'click', () => this.exportTableData('records'));
        on('exportOutpatients', 'click', () => this.exportTableData('outpatients'));
        on('exportInpatients', 'click', () => this.exportTableData('inpatients'));
        on('exportDataBtn', 'click', () => this.exportAllData());
        on('importDataBtn', 'click', () => this.importData());
        on('importFileInput', 'change', (e) => this.handleFileImport(e));
        on('clearAllDataBtn', 'click', () => this.clearAllData());

        // Mobile menu toggle
        on('menuToggle', 'click', () => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.classList.toggle('show');
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.getElementById('menuToggle');
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        });
    }

    switchSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const section = document.getElementById(sectionId);
        if (!section) return;
        section.classList.add('active');

        if (sectionId === 'patient-registration') {
            this.updateGeneratedFolderNumber();
            this.toggleNHISFields();
        }
    }
}

// ==================== NOTIFICATION STYLES ==================== 
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .notification.show {
        opacity: 1;
    }

    .notification-success {
        border-left: 4px solid #00a86b;
        color: #155724;
    }

    .notification-success i {
        color: #00a86b;
    }

    .notification-error {
        border-left: 4px solid #dc3545;
        color: #721c24;
    }

    .notification-error i {
        color: #dc3545;
    }

    .notification-info {
        border-left: 4px solid #0066cc;
        color: #004085;
    }

    .notification-info i {
        color: #0066cc;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @media (max-width: 480px) {
        .notification {
            top: 10px;
            right: 10px;
            left: 10px;
            width: calc(100% - 20px);
        }
    }
`;
document.head.appendChild(notificationStyles);

// ==================== INITIALIZE APPLICATION ====================
let hms;

function initApp() {
    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
        hms = new HospitalManagementSystem();
        window.hms = hms;
        hms.init();
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
