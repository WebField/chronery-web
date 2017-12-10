import { Component, OnInit, OnDestroy } from '@angular/core';
import * as moment from 'moment/moment';
import { Project } from '../../models/project';
import { Observable } from 'rxjs/Observable';
import { FormControl } from '@angular/forms';
import { DataSource } from '@angular/cdk/collections';
import { Utility } from '../../utils/utility';
import { Angular2Csv } from 'angular2-csv';
import { ObservableMedia } from '@angular/flex-layout';
import { ProjectsService } from '../../services/projects/projects.service';
import { WorkingHoursService } from '../../services/working-hours/working-hours.service';
import { WorkingHours } from '../../models/working-hours';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
	selector: 'chy-report',
	templateUrl: './report.component.html',
	styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit, OnDestroy {
	date: Date;

	startDate: Date;
	endDate: Date;
	projects: Project[] = [];
	filteredProjects: Observable<Project[]>;
	selectedProject: Project;
	projectsCtrl: FormControl;
	totalTime: string;
	isLoading = false;

	dataSource: ReportSource | null;
	displayedColumns = ['date', 'from', 'to', 'spent', 'projectNumber', 'projectName', 'comment'];

	constructor(private projectsService: ProjectsService,
				private workingHoursService: WorkingHoursService,
				private media: ObservableMedia) {


		// initialize start and end date for the date pickers
		this.startDate = moment().startOf('month').toDate();
		this.endDate = moment().endOf('month').toDate();

		this.projectsCtrl = new FormControl();
		const allProjects = new Project(null, null, null, 'All');
		this.selectedProject = allProjects;
		this.projects = [allProjects];

		this.projectsService.dataChange.subscribe((data: Project[]) => {
			this.projects = data ? this.projects.concat(data) : this.projects;
			this.filteredProjects = this.projectsCtrl.valueChanges
				.startWith(null)
				.map(project => project && typeof project === 'object' ? project.name : project)
				.map(name => name ? this.filterProjects(name) : this.projects.slice());

		});

		this.dataSource = new ReportSource(this.workingHoursService);
		this.updateReport();
	}

	ngOnInit() {
		this.workingHoursService.dataIsLoading.subscribe((isLoading: boolean) => this.isLoading = isLoading);
	}

	get isMobile(): boolean {
		return !this.media.isActive('gt-sm');
	}

	get hasData(): boolean {
		return this.workingHoursService.data ? this.workingHoursService.data.length > 0 : false;
	}


	updateReport(): void {
		if (!this.startDate && !this.endDate) {
			return;
		}

		const from = Utility.encodeDate(this.startDate);
		const to = Utility.encodeDate(this.endDate);

		this.workingHoursService.onFilterData(from, to)
			.then((data: WorkingHours[]) => {
				const times = data.map((work: WorkingHours) => {
					return work.spent;
				});
				if (times.length) {
					this.totalTime = Utility.sumTotalTimes(times);
				} else {
					this.totalTime = null;
				}
			});
	}

	updateProjectFilter(): void {
		this.dataSource.filter = this.selectedProject;
	}

	filterProjects(val: string) {
		return this.projects.filter(project => new RegExp(val, 'i').test(project.name));
	}

	displayFn(project: Project) {
		if (project) {
			return project.name ? project.name : '';
		}
	}

	exportReportToCSV(): void {
		const data = this.workingHoursService.dataChange.getValue();
		const csvData = data.map((work: WorkingHours) => {
			const csvObject: any = {};
			csvObject.date = work.date;
			csvObject.from = work.from;
			csvObject.to = work.to;
			csvObject.spent = work.spent;
			csvObject.comment = work.comment || '';
			csvObject.projectId = work.project.id;
			csvObject.projectNumber = work.project.number;
			csvObject.projectName = work.project.name;
			return csvObject;
		});
		const report = new Angular2Csv(csvData, `Chronery Report form ${Utility.encodeDate(this.startDate)} to ${Utility.encodeDate(this.endDate)}`, {showLabels: true});
	}

	ngOnDestroy() {
	}
}


export class ReportSource extends DataSource<any> {
	private _filterChange = new BehaviorSubject(new Project);

	get filter(): Project {
		return this._filterChange.value;
	}

	set filter(filter: Project) {
		this._filterChange.next(filter);
	}

	constructor(private workingHoursService: WorkingHoursService) {
		super();
	}

	connect(): Observable<WorkingHours[]> {
		const displayDataChanges = [
			this.workingHoursService.dataChange,
			this._filterChange
		];

		return Observable.merge(...displayDataChanges).map(() => {
			if (this.workingHoursService.data) {
				if (this.filter.id) {
					return this.workingHoursService.data.slice().filter((item: WorkingHours) => {
						return item.project.id === this.filter.id || !this.filter.id;
					});
				} else {
					return this.workingHoursService.data;
				}
			} else {
				return [];
			}
		});
	}

	disconnect() {
	}
}
