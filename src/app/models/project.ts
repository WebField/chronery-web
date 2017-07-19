export class Project {
	_id: string;
	_rev: string;
	number: string;
	name: string;

	constructor(number?: string, name?: string) {
		this.number = number || '';
		this.name = name || '';
	}
}
