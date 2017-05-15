import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Work} from '../../models/work';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Project} from '../../models/project';
import {Observable} from 'rxjs/Observable';

@Component({
	selector: 'wtc-work-card',
	templateUrl: './work-card.component.html',
	styleUrls: ['./work-card.component.scss']
})


export class WorkCardComponent implements OnInit {
	@Input() work: Work;
	@Output() workDeleted = new EventEmitter();

	filteredProjects: Observable<Project[]>;
	projects = [
		new Project('52342', 'Landing Pages'),
		new Project('1234', 'Maintenance Interface'),
		new Project('6576', 'Mobile Time Tracking app'),
		new Project('52342', 'TYPO3 Website')
	];

	workForm: FormGroup;

	constructor(public fb: FormBuilder) {

	}

	ngOnInit() {
		const timeRegex = '^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$';

		this.workForm = this.fb.group({
			project: [this.work.projectName, Validators.required],
			from: [this.work.from, [Validators.required, Validators.pattern(timeRegex)]],
			to: [this.work.to, [Validators.required, Validators.pattern(timeRegex)]],
			comment: this.work.comment
		});

		// Autocomplete functionality
		this.filteredProjects = this.workForm.controls['project'].valueChanges
			.startWith(null)
			.map(project => project && typeof project === 'object' ? project.name : project)
			.map(name => name ? this.filterProjects(name) : this.projects.slice());

		(<FormControl>this.workForm.controls['project']).registerOnChange(() => {
			console.log(this.work.projectName);
		});
	}

	filterProjects(val: string) {
		return this.projects.filter(project => new RegExp(val, 'i').test(project.name));
	}

	onTimeChanged(): void {
		if (this.workForm.controls['from'].valid && this.workForm.controls['to'].valid) {
			this.work.setSpent();
		}
	}

	deleteWork(): void {
		this.workDeleted.emit();
	}
}