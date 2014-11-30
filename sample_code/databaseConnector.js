/**
 * The following code provides an example of a Postgres DB connection library
 **/

var pg = require('pg');
var uuid = require('node-uuid');
var qm = require('./questionMechanism.js');

var config = require('../config.js');

var connString = process.env.DATABASE_URL || config.connString;


/*START AUTH METHODS*/

/*
Description
This will be used in the student/instructor registration process. Creates new user, returns info

Params
@username: the username of the new user
@password: the password of the new user
@role: the role of the new user(instructor=2/student=1)

Returns 
@err: if a connection problem arrises, this will contain said info
@user(username,uid,auth,role): the user data of the new user
@success(boolean): true if user could be created(is not already created)
*/
exports.createUser = function(username, password, role, callback)
{
	pg.connect(connString, function (err, client, done) 
	{
	    if (err) {
	      callback(err);
	    }
	    else 
	    {
	    	var SQLQuery = "INSERT into users(username,password,role) VALUES($1,$2,$3)";

	    	client.query({ text : SQLQuery,
	                     values : [username,password,role]},
		        function (err, updateResult) 
		        {
		        	// Ends the "transaction":
			        done();

			        //Checks for errors w/ insertion
		        	if(err)
		        	{
		        		callback(err,undefined,false);
		        	}
			       	
			       	//Verifies user was created, returns data if no error.
			       	exports.getUserByUsername(username, function(err, data, success)
			       	{
			       		if(success && err == undefined)
			       		{
			       			callback(err,data,success);
			       		}
			       		else{
			       			callback("Could not get user after creating... " + err, data, success);
			       		}
			       	});
			       	
		    });
		}
	});
}


/*
Description
This will be used everytime a user goes to a new page/api. Checks that the user is logged in and returns actual user.

Params
@auth: the auth token of a user

Returns 
@err: if a connection problem arrises, this will contain said info
@user(uid,username,auth,role): the user data of matching users' auth
@success(boolean): true if user found for auth, false if not
*/
exports.getUserByAuth = function(auth, callback)
{
	pg.connect(connString, function (err, client, done) 
	{
	    if (err) {
	      callback(err);
	    }
	    else 
	    {
	    	var SQLQuery = "SELECT * FROM users where auth=$1";

	    	client.query({ text : SQLQuery,
	                     values : [auth]},
		        function (err, result) 
		        {
			        // Ends the "transaction":
			        done();
			        
			        if (err || result.rows.length == 0) {
			          callback(err || "Auth not valid", undefined, false);
			        }
			        else 
			        {
			        	user = {};
			        	user.uid = result.rows[0].uid;
			        	user.username = result.rows[0].username;
			        	user.auth = result.rows[0].auth;
			        	user.role = result.rows[0].role;

			        	callback(undefined, user, true);
			        }	
		    	});
		}
	});
}

/*
Description
This is called when a user wants to login. Creates new auth token in db, returns it.

Params
@username: the username of a user
@password the password of a user

Returns 
@err: if a connection problem arises, this will contain said info
@user(username,auth, uid, role): the user data(+ new auth) of matching users' username/pass
@success(boolean): true if user found for username/password combo, false if not(Such as bad username/pass/err)
*/
exports.login = function(username,password, callback)
{
	pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {
    	var SQLQuery = "SELECT * FROM users where username=$1 AND password=$2";

    	client.query({ text : SQLQuery,
                     values : [username,password]},
        function (err, result) {
        // Ends the "transaction":
        done();
        
        if (err) {
          callback(err, undefined, false);
        }
        else 
        {
           		if(result.rows.length > 0)
        		{
        			var auth = uuid.v4();
        			//Create auth, push new auth
        			var authSqlQuery = "UPDATE users set auth=$1 where username=$2 AND password=$3";

		    		client.query({ text : authSqlQuery,
		                     values : [auth,username,password]},
		        	function (err, updateResult) 
		        	{
		        		// Disconnects from the database
				        client.end();
				        // This cleans up connected clients to the database and allows subsequent requests to the database
				        pg.end();

		        		if(!err)
		        		{
			        		var returnObj = {};
		        			returnObj.username = username;
		        			returnObj.auth = auth;
		        			returnObj.uid = result.rows[0].uid;
		        			returnObj.role = result.rows[0].role;

		        			callback(undefined, returnObj, true);
		        		}
		        		else
		        		{
		        			callback(err, undefined, false);
		        		}
		        	});

        			
        		}else{
        			callback({success:"false", message:"invalid login"}, undefined, false);
        		}
        }
      });
    }
  });
}



//User methods

/*
Description
This returns a users details by their username. This can be used for getting uid and other details

Params
@username: the user's username

Returns 
@err: if a connection problem arises, this will contain said info
@user(username,uid,auth,role): the user data of matching users' username
@success(boolean): true if user found from username, false if not
*/
exports.getUserByUsername = function(username, callback)
{
	pg.connect(connString, function (err, client, done) 
	{
	    if (err) {
	      callback(err);
	    }
	    else 
	    {
	    	var SQLQuery = "SELECT uid,username,auth,role FROM users where username=$1";

	    	client.query({ text : SQLQuery,
	                     values : [username]},
		        function (err, result) 
		        {
			        // Ends the "transaction":
			        done();
			        
			        if (err || result.rows.length == 0) {
			          callback(err || "User not found with username " + username, undefined, false);
			        }
			        else 
			        {
			        	user = result.rows[0];
			        	callback(undefined, user, true);
			        }	
		    	});
		}
	});
}

/*

Description
This returns a users details by their uid. This can be used for viewing users

Params
@uid: the user's uid

Returns 
@err: if a connection problem arises, this will contain said info
@user(username,uid,auth,role): the user data of matching users' uid
@success(boolean): true if user found from uid, false if not
*/
exports.getUserById = function(uid, callback)
{
	pg.connect(connString, function (err, client, done) 
	{
	    if (err) {
	      callback(err);
	    }
	    else 
	    {
	    	var SQLQuery = "SELECT uid,username,auth,role FROM users where uid=$1";

	    	client.query({ text : SQLQuery,
	                     values : [uid]},
		        function (err, result) 
		        {
			        // Ends the "transaction":
			        done();
			        
			        if (err || result.rows.length == 0) {
			          callback(err || "User not found with id " + uid, undefined, false);
			        }
			        else 
			        {
			        	user = result.rows[0];
			        	callback(undefined, user, true);
			        }	
		    	});
		}
	});
}

/*
Description
This will edit a user

Params
@uid: the id of the user you want to edit
@username: the new username
@password: the new password

Returns 
@err: if a connection problem arises, this will contain said info
@success(boolean): if the user was updated successfully
*/

exports.editUser = function(uid, username, password, callback)
{
	//uid, username, password
	pg.connect(connString, function (err, client, done) 
	{
	    if (err) {
	      callback(err);
	    }
	    else{
	    	var SQLQuery = "UPDATE users SET username=$1, password=$2 where uid=$3";

	    	client.query({ text : SQLQuery,
	                     values : [username,password,uid]},
		        function (err, updateResult) 
		        {
		        	// Ends the "transaction":
			        done();

			        //Checks for errors w/ update
		        	if(err)
		        	{
		        		callback(err,false);
		        	}else
		        	{
			        	callback(undefined, true);
		        	}		       	
		    });
		}
	});
}



/*END USER METHODS*/


/* Temp random stuff */

/*
Description
This returns all students that are part of an instructor

Params
@iid: the instructors uid

Returns 
@err: if a connection problem arises, this will contain said info
@users(Array(uid,username,role)): the students of the instructor
*/
exports.getInsructorStudents = function(iid, callback) {

  pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {
    	var SQLQuery = "SELECT u2.uid,u2.username,u2.role FROM roster r left join users u1 on u1.uid=r.iid left join users u2 on r.sid = u2.uid where r.iid=$1";

    	client.query({ text : SQLQuery,
                     values : [iid]},
        function (err, result) {
        // Ends the "transaction":
        done();
        // Disconnects from the database
        client.end();
        // This cleans up connected clients to the database and allows subsequent requests to the database
        pg.end();

        if (err) {
          callback(err, undefined);
        }
        else 
        {
            callback(undefined, result.rows);
        }
      });
    }
  });
}

/*
Description
Adds student to an instructors roster

Params
@uid: the students uid
@iid: the instructors uid

Returns 
@err: if a connection problem arises, this will contain said info
@success(boolean): if it was successful
*/
exports.addStudentToInstructor = function(uid, iid, callback) {

  pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {
    	var SQLQuery = "INSERT INTO Roster Values($1,$2);";

    	client.query({ text : SQLQuery,
                     values : [iid,uid]},
        function (err, result) {
        // Ends the "transaction":
        done();
        // Disconnects from the database
        client.end();
        // This cleans up connected clients to the database and allows subsequent requests to the database
        pg.end();

        if (err) {
          callback(err, false);
        }
        else 
        {
            callback(undefined, true);
        }
      });
    }
  });
}













/*START QUESTION METHODS*/


/*
Description
Adds question to instructor set

Params
@qid: the question the instructor wants to add to their set
@iid: the instructors uid

Returns 
@err: if a connection problem arises, this will contain said info
@success(boolean): if it was successful
*/
exports.addQuestionToInstructorSet = function(qid, iid, callback) 
{
  pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {
    	var SQLQuery = "INSERT INTO instructorquestions(iid,qid) VALUES($1,$2)";

    	client.query({ text : SQLQuery,
                     values : [iid,qid]},
        function (err, result) {
        // Ends the "transaction":
        done();
        // Disconnects from the database
        client.end();
        // This cleans up connected clients to the database and allows subsequent requests to the database
        pg.end();

        if (err) {
          callback(err, false);
        }
        else 
        {
            callback(undefined, true);
        }
      });
    }
  });
}

/*
Description
Removes question from instructor set

Params
@qid: the question the instructor wants to remove from their set
@iid: the instructors uid

Returns 
@err: if a connection problem arises, this will contain said info
@success(boolean): if it was successful
*/
exports.removeQuestionFromInstructorSet = function(qid, iid, callback) 
{
  pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {
    	var SQLQuery = "DELETE from instructorquestions WHERE iid=$1 and qid=$2";

    	client.query({ text : SQLQuery,
                     values : [iid,qid]},
        function (err, result) {
        // Ends the "transaction":
        done();
        // Disconnects from the database
        client.end();
        // This cleans up connected clients to the database and allows subsequent requests to the database
        pg.end();

        if (err) {
          callback(err, false);
        }
        else 
        {
            callback(undefined, true);
        }
      });
    }
  });
}



/*
Description
This will copy all details of a question based on its qid and then give back the new question.

Params
@qid: The question id to copy

Returns 
@err: if a connection problem arises or no question was found, this will contain said info
@question(qid): the new duplicate question with the given qid
*/
exports.copyQuestion = function(qid, callback)
{
	exports.getQuestion(qid,function(err, question)
	{
		if(err)
		{
			callback(err, undefined);
		}else{

			exports.createQuestion(question.question,question.answer,question.type, function(err, questionNew)
			{
				if(err)
				{
					callback(err,undefined);
				}else{
					callback(undefined,questionNew);
				}
			});
		}
	});
}



/*
Description
This will get all details of a question based on its qid

Params
@qid: The question id

Returns 
@err: if a connection problem arises or no question was found, this will contain said info
@question(qid,question,answer,type,datecreated,archived): the question with the given qid
*/
exports.getQuestion = function(qid, callback)
{
	pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {
    	var SQLQuery = "SELECT * FROM questionpool where qid = $1";

    	client.query({ text : SQLQuery,
                     values : [qid]},
        function (err, result) {
        // Ends the "transaction":
        done();
        // Disconnects from the database
        client.end();
        // This cleans up connected clients to the database and allows subsequent requests to the database
        pg.end();

        if (err) {
          callback(err, undefined);
        }
        else {
        	if(result.rows.length == 0)
        	{
        		callback({message:"Could not find question with qid " + qid}, undefined);
        	}else{
            	callback(undefined, result.rows[0]);
            }
        }
      });
    }
  });
}



/*
Description
This will get a list of all attempts a user has made at a single question

Params
@uid: The user id
@qid: The question id

Returns 
@err: if a connection problem arises or no question was found, this will contain said info
@answers(uaid,answer,iscorrect,feedback): The question attempts at the given question
*/
exports.getQuestionAttemptsByUser = function(uid,qid, callback)
{
	pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {
    	var SQLQuery = "SELECT ua.uaid,ua.answer,ua.iscorrect,ua.feedback  from useranswers ua left join questionpool qp on ua.qid = qp.qid where ua.uid = $1 and ua.qid = $2 order by ua.uaid asc";

    	client.query({ text : SQLQuery,
                     values : [uid,qid]},
        function (err, result) {
        // Ends the "transaction":
        done();
        // Disconnects from the database
        client.end();
        // This cleans up connected clients to the database and allows subsequent requests to the database
        pg.end();

        if (err) {
          callback(err, undefined);
        }
        else {
        	callback(undefined, result.rows);
        }
      });
    }
  });
}





/*
TODO:
Check to see if a user has successfully answered each question, return with the response

Description
This will get all questions in an instructors own set or a students' intructors set

Params
@uid: The user id

Returns 
@err: if a connection problem arises or no question was found, this will contain said info
@questions(Array((qid,question,type))): the questions in the set
*/
exports.getUserQuestionSet = function(uid, callback)
{
	pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {


    	var checkInstructorSQLQuery = "SELECT * from roster where sid = $1";

    	client.query({ text : checkInstructorSQLQuery,
                     values : [uid]},
        function (err, checkResult) {
	        // Ends the "transaction":
	        //done();

	        if(err)
	        {
	        	callback(err,undefined);
	        }
	        else
	        {
	        	var iid = -1;

	        	//If user is not found in roster, it is instructor
	        	if(checkResult.rows.length == 0)
	        	{
	        		iid = uid;
	        		console.log("Is instructor");
	        	}
	        	else
	        	{
	        		iid = checkResult.rows[0].iid;
	        		console.log("Is student");
	        	}
	        	
	        	//For having user responses too... (Also add uid to values below(its $1))
	        	//"SELECT * from instructorquestions i left join questionpool p on i.qid = p.qid left join useranswers ua on ua.uid = $1 and p.qid = ua.qid where i.iid = $2";
		    	var SQLQuery = "SELECT p.qid,p.question,p.type from instructorquestions i left join questionpool p on i.qid = p.qid where i.iid = $1";

		    	client.query({ text : SQLQuery,
		                     values : [iid]},
		        function (err, result) {
			        // Ends the "transaction":
			        done();
			        // Disconnects from the database
			        client.end();
			        // This cleans up connected clients to the database and allows subsequent requests to the database
			        pg.end();

			        if (err) {
			          callback(err, undefined);
			        }
			        else {
			    		callback(undefined, result.rows);	
			        }
		    	});
	    	}
	      });
	    }
    });
}



/*
Description
This will get all details of a question based on its qid

Params
@uid: The user id of who is submitting an answer
@qid: The question the user is answering
@userAnswer: The user's attempt at an answer

Returns 
@err: if a connection problem arises or no question was found, this will contain said info
@evaluation(isCorrect,feedback): Whether the answer is was correct or not and feedback
*/
exports.submitAnswer = function(uid, qid, userAnswer,callback)
{
	exports.getQuestion(qid, function(err, question)
	{
		if(err != undefined)
		{
			callback(err, undefined);
		}
		else{
			var evaluation = qm.evaluateQuestion(question.answer, userAnswer, question.type);

			pg.connect(connString, function (err, client, done) 
			{
			    if (err) {
			      callback(err);
			    }
			    else 
			    {
			    	var SQLQuery = "INSERT INTO UserAnswers(qid, uid, answer, isCorrect, feedback) Values($1,$2,$3,$4,$5);";

			    	client.query({ text : SQLQuery,
			                     values : [qid,uid,userAnswer,evaluation.isCorrect,evaluation.feedback]},
				        function (err, updateResult) 
				        {
				        	// Ends the "transaction":
					        done();

					        //Checks for errors w/ insertion
				        	if(err)
				        	{
				        		callback(err,undefined);
				        	}
				        	else
				        	{
				        		callback(undefined, evaluation);
				        	}				       	
				    });
				}
			});
		}
	});	
}

/*
Description
This will create a question and it'll be added to the questionpool. Does NOT add it to instructor's set

Params
@question: the question text
@answer: the correct answer provided by an instructor(JSON format)
@type: Whether it's in chen or crowes foot

Returns 
@err: if a connection problem arises, this will contain said info
@question(qid): the question data of the new question
*/

exports.createQuestion = function(question, answer, type, callback)
{
	//question, answer, type, dateCreated, archived
	pg.connect(connString, function (err, client, done) 
	{
	    if (err) {
	      callback(err);
	    }
	    else{
	    
	    	var archived = false;

	    	var SQLQuery = "INSERT into questionpool(question,answer,type,dateCreated, archived) VALUES($1,$2,$3, current_timestamp ,$4) RETURNING qid";

	    	client.query({ text : SQLQuery,
	                     values : [question,answer,type,archived]},
		        function (err, updateResult) 
		        {
		        	// Ends the "transaction":
			        done();

			        //Checks for errors w/ insertion
		        	if(err)
		        	{
		        		callback(err,undefined);
		        	}else
		        	{
		        		if(updateResult.rows.length > 0)
		        		{
			        		var qid = updateResult.rows[0].qid;

			        		var resultObj = {};
			        		resultObj.qid = qid;

			        		callback(undefined, resultObj);
			        	}
			        	else{
			        		callback({message:"No qid was returned..."},undefined);
			        	}
		        	}		       	
		    });
		}
	});
}



/*
Description
This will edit a question

Params
@qid: the id of the question you want to edit
@question: the question text
@answer: the correct answer provided by an instructor(JSON format)
@type: Whether it's in chen or crowes foot

Returns 
@err: if a connection problem arises, this will contain said info
@success(boolean): if the question was updated successfully
*/

exports.editQuestion = function(qid, question, answer, type, callback)
{
	//question, answer, type, dateCreated, archived
	pg.connect(connString, function (err, client, done) 
	{
	    if (err) {
	      callback(err);
	    }
	    else{
	    	var SQLQuery = "UPDATE questionpool SET question=$1, answer=$2,type=$3 where qid=$4";

	    	client.query({ text : SQLQuery,
	                     values : [question,answer,type,qid]},
		        function (err, updateResult) 
		        {
		        	// Ends the "transaction":
			        done();

			        //Checks for errors w/ update
		        	if(err)
		        	{
		        		callback(err,false);
		        	}else
		        	{
			        	callback(undefined, true);
		        	}		       	
		    });
		}
	});
}


/*
Description
This will get all unarchived questions created by every instructor

Params
------

Returns 
@err: if a connection problem arises or no question was found, this will contain said info
@questions(Array(qid,question,type)): all unarchived questions created
*/
exports.getAllUnarchivedQuestions = function(callback)
{
	pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {
    	var SQLQuery = "SELECT qid, question, type, dateCreated, archived FROM questionpool where archived=false";

    	client.query({ text : SQLQuery,
                     values : []},
        function (err, result) {
	        // Ends the "transaction":
	        done();
	        // Disconnects from the database
	        client.end();
	        // This cleans up connected clients to the database and allows subsequent requests to the database
	        pg.end();

	        if (err) {
	          callback(err, undefined);
	        }
	        else 
	        {
	        	callback(undefined, result.rows);
	        }
        });
    }
  });
}


/*END QUESTION METHODS*/







/*START ADMIN STUFF*/

/*
Description
This will get all questions created by every instructor

Params
------

Returns 
@err: if a connection problem arises or no question was found, this will contain said info
@questions(Array(qid,question,type)): all questions created
*/
exports.getAllQuestions = function(callback)
{
	pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {
    	var SQLQuery = "SELECT qid, question, type, dateCreated, archived FROM questionpool";

    	client.query({ text : SQLQuery,
                     values : []},
        function (err, result) {
	        // Ends the "transaction":
	        done();
	        // Disconnects from the database
	        client.end();
	        // This cleans up connected clients to the database and allows subsequent requests to the database
	        pg.end();

	        if (err) {
	          callback(err, undefined);
	        }
	        else 
	        {
	        	callback(undefined, result.rows);
	        }
        });
    }
  });
}

/*
Description
This will get all instructors

Params
------

Returns 
@err: if a connection problem arises or no question was found, this will contain said info
@instructors(uid,username): all instructors
*/
exports.getAllInstructors = function(callback)
{
	pg.connect(connString, function (err, client, done) {
    if (err) {
      callback(err);
    }
    else {
    	var SQLQuery = "SELECT uid, username from users where role=1";

    	client.query({ text : SQLQuery,
                     values : []},
        function (err, result) {
	        // Ends the "transaction":
	        done();
	        // Disconnects from the database
	        client.end();
	        // This cleans up connected clients to the database and allows subsequent requests to the database
	        pg.end();

	        if (err) {
	          callback(err, undefined);
	        }
	        else 
	        {
	        	callback(undefined, result.rows);
	        }
        });
    }
	});
}




/*
Description
This will set the question to being archived or not

Params
@qid: the id of the question you want to edit
@archive: set question to archived or not

Returns 
@err: if a connection problem arises, this will contain said info
@success(boolean): if the question was (un)archived successfully
*/

exports.archiveQuestion = function(qid, archived, callback)
{
	//question, answer, type, dateCreated, archived
	pg.connect(connString, function (err, client, done) 
	{
	    if (err) {
	      callback(err);
	    }
	    else{
	    	var SQLQuery = "UPDATE questionpool SET archived=$1 where qid=$2";

	    	client.query({ text : SQLQuery,
	                     values : [archived, qid]},
		        function (err, updateResult) 
		        {
		        	// Ends the "transaction":
			        done();

			        //Checks for errors w/ update
		        	if(err)
		        	{
		        		callback(err,false);
		        	}else
		        	{
			        	callback(undefined, true);
		        	}		       	
		    });
		}
	});
}






/*END ADMIN STUFF*/
