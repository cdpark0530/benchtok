import React, {useState} from "react";

export default function Header() {
	const [date, setDate] = useState(new Date().toTimeString());
	fetch(`/api/v1/post/findPageBeforeTime/${0}/${0}`)
		.then(res => res.json())
		.then(json => {
			setDate(new Date(json[0].createdDate).toTimeString());
		});
	return (
		<linear-layout style={{color: "teal"}}>{date}</linear-layout>
	);
}