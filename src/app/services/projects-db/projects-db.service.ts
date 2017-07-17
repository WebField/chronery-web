import {Injectable} from '@angular/core';
import * as PouchDB from 'pouchdb';
import {Project} from '../../models/project';
import Database = PouchDB.Database;
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class ProjectsDbService {

	dataChange: BehaviorSubject<Project[]> = new BehaviorSubject<Project[]>([]);
	db: Database<Project>;

	constructor() {
		this.db = new PouchDB('wtc-projects');
		this.db.allDocs({
			include_docs: true
		}).then((result) => {

			const data: Project[] = [];
			result.rows.map((row) => {
				data.push(row.doc);
			});
			this.dataChange.next(data);
			this.db.changes({live: true, since: 'now', include_docs: true}).on('change', (change) => {
				this.handleChange(change);
			});
		}).catch((error) => {
			console.log(error);
		});
	}

	getProjects(): BehaviorSubject<Project[]> {
		if (this.dataChange) {
			return this.dataChange;
		}
	}

	createProject(project: Project): void {
		project._id = 'project' + Date.now();
		console.log(project);
		this.db.post(project).catch((error) => {
			console.log(error);
		});
	}

	updateProject(project: Project): void {
		this.db.put(project).catch((error) => {
			console.log(error);
		});
	}

	deleteProject(project: Project): void {
		this.db.remove(project).catch((error) => {
			console.log(error);
		})
	}

	handleChange(change) {
		let changedDoc = null;
		let changedIndex = null;

		this.dataChange.getValue().forEach((doc, index) => {
			if (doc._id === change.id) {
				changedDoc = doc;
				changedIndex = index;
			}
		});
		// A document was deleted
		const data = this.dataChange.getValue();
		if (change.deleted) {
			data.splice(changedIndex, 1);
			this.dataChange.next(data);
		} else {
			// a document was updated
			if (changedDoc) {
				data[changedIndex] = change.doc;
				this.dataChange.next(data);
			} else {
				data.push(change.doc);
				this.dataChange.next(data);
			}
		}
	}
}











